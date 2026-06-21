import { Router } from "express";
import { db, Role } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// GET /stats - Get main dashboard statistics and graph data
router.get("/", requireAuth, async (req, res) => {
    let totalAlunos = 0;
    let presentesHoje = 0;
    let aulasDoDia = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    if (req.user.role === Role.TEACHER) {
        const teacherClasses = await db.collection("classes")
            .find({ professorId: req.user.sub })
            .toArray();
        const classIds = teacherClasses.map(c => c._id.toString());
        totalAlunos = await db.collection("students").countDocuments({
            $or: [
                { classId: { $in: classIds } },
                { classIds: { $in: classIds } }
            ]
        });
        presentesHoje = await db.collection("attendances").countDocuments({
            date: todayStr,
            status: "presente",
            classId: { $in: classIds }
        });
        aulasDoDia = await db.collection("lessons").countDocuments({
            data: todayStr,
            classId: { $in: classIds }
        });
    }
    else {
        totalAlunos = await db.collection("students").countDocuments();
        presentesHoje = await db.collection("attendances").countDocuments({
            date: todayStr,
            status: "presente"
        });
        aulasDoDia = await db.collection("lessons").countDocuments({
            data: todayStr
        });
    }
    const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    const weeklyPresenca = weekdays.map((dia, index) => {
        const presentesBase = Math.floor(totalAlunos * 0.8);
        const variance = (index % 3 === 0) ? -1 : 1;
        const presentes = totalAlunos > 0 ? Math.max(0, Math.min(totalAlunos, presentesBase + variance)) : 0;
        const ausentes = totalAlunos > presentes ? totalAlunos - presentes : 0;
        return { dia, presentes, ausentes };
    });
    // Calculate risk students
    let studentsFilter = {};
    if (req.user.role === Role.TEACHER) {
        const teacherClasses = await db.collection("classes")
            .find({ professorId: req.user.sub })
            .toArray();
        const classIds = teacherClasses.map(c => c._id.toString());
        studentsFilter = {
            $or: [
                { classId: { $in: classIds } },
                { classIds: { $in: classIds } }
            ]
        };
    }
    const allStudentsList = await db.collection("students").find(studentsFilter).toArray();
    const studentIdsStr = allStudentsList.map(s => s._id.toString());
    const allAttendances = await db.collection("attendances")
        .find({ studentId: { $in: studentIdsStr } })
        .toArray();
    const attendancesByStudent = {};
    allAttendances.forEach((att) => {
        if (!attendancesByStudent[att.studentId]) {
            attendancesByStudent[att.studentId] = { total: 0, presents: 0 };
        }
        attendancesByStudent[att.studentId].total += 1;
        if (att.status === "presente" || att.status === "PRESENT") {
            attendancesByStudent[att.studentId].presents += 1;
        }
    });
    const allGrades = await db.collection("grades")
        .find({ studentId: { $in: studentIdsStr } })
        .toArray();
    const gradesByStudent = {};
    allGrades.forEach((g) => {
        if (!gradesByStudent[g.studentId]) {
            gradesByStudent[g.studentId] = { sumPct: 0, count: 0 };
        }
        gradesByStudent[g.studentId].sumPct += (g.nota / g.notaMaxima) * 10;
        gradesByStudent[g.studentId].count += 1;
    });
    const riskStudents = [];
    for (const student of allStudentsList) {
        const idStr = student._id.toString();
        const attStats = attendancesByStudent[idStr];
        let attendanceRate = null;
        if (attStats && attStats.total > 0) {
            attendanceRate = Math.round((attStats.presents / attStats.total) * 100);
        }
        const grStats = gradesByStudent[idStr];
        let gradeAverage = null;
        if (grStats && grStats.count > 0) {
            gradeAverage = Math.round((grStats.sumPct / grStats.count) * 10) / 10;
        }
        const hasLowAttendance = attendanceRate !== null && attendanceRate < 75;
        const hasLowGrades = gradeAverage !== null && gradeAverage < 7.0;
        if (hasLowAttendance || hasLowGrades) {
            let motivo = "";
            if (hasLowAttendance && hasLowGrades) {
                motivo = "Frequência e Notas Baixas";
            }
            else if (hasLowAttendance) {
                motivo = "Frequência Baixa";
            }
            else {
                motivo = "Média de Notas Baixa";
            }
            riskStudents.push({
                id: idStr,
                nome: student.nome,
                curso: student.curso,
                mediaNotas: gradeAverage,
                frequencia: attendanceRate,
                motivo
            });
        }
    }
    return res.json({
        stats: {
            totalAlunos,
            presentesHoje,
            aulasDoDia,
        },
        weeklyPresenca,
        riskStudents,
    });
});
// GET /stats/students - Get student specific statistics
router.get("/students", requireAuth, async (req, res) => {
    let filter = {};
    if (req.user.role === Role.TEACHER) {
        const teacherClasses = await db.collection("classes")
            .find({ professorId: req.user.sub })
            .toArray();
        const classIds = teacherClasses.map(c => c._id.toString());
        filter = {
            $or: [
                { classId: { $in: classIds } },
                { classIds: { $in: classIds } }
            ]
        };
    }
    const totalCount = await db.collection("students").countDocuments(filter);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    const newRegistrations7d = await db.collection("students").countDocuments({
        ...filter,
        createdAt: { $gte: sevenDaysAgoStr }
    });
    const todayStr = new Date().toISOString().split("T")[0];
    let attendanceFilter = {
        date: todayStr,
        status: "presente"
    };
    if (req.user.role === Role.TEACHER) {
        const teacherClasses = await db.collection("classes")
            .find({ professorId: req.user.sub })
            .toArray();
        const classIds = teacherClasses.map(c => c._id.toString());
        attendanceFilter.classId = { $in: classIds };
    }
    const presentToday = await db.collection("attendances").countDocuments(attendanceFilter);
    const recentStudentsList = await db.collection("students")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
    const recentStudents = recentStudentsList.map((s) => ({
        id: s._id.toString(),
        name: s.nome,
        createdAt: s.createdAt,
    }));
    // Calculate risk students
    const allStudentsList = await db.collection("students").find(filter).toArray();
    const studentIdsStr = allStudentsList.map(s => s._id.toString());
    const allAttendances = await db.collection("attendances")
        .find({ studentId: { $in: studentIdsStr } })
        .toArray();
    const attendancesByStudent = {};
    allAttendances.forEach((att) => {
        if (!attendancesByStudent[att.studentId]) {
            attendancesByStudent[att.studentId] = { total: 0, presents: 0 };
        }
        attendancesByStudent[att.studentId].total += 1;
        if (att.status === "presente" || att.status === "PRESENT") {
            attendancesByStudent[att.studentId].presents += 1;
        }
    });
    const allGrades = await db.collection("grades")
        .find({ studentId: { $in: studentIdsStr } })
        .toArray();
    const gradesByStudent = {};
    allGrades.forEach((g) => {
        if (!gradesByStudent[g.studentId]) {
            gradesByStudent[g.studentId] = { sumPct: 0, count: 0 };
        }
        gradesByStudent[g.studentId].sumPct += (g.nota / g.notaMaxima) * 10;
        gradesByStudent[g.studentId].count += 1;
    });
    const riskStudents = [];
    for (const student of allStudentsList) {
        const idStr = student._id.toString();
        const attStats = attendancesByStudent[idStr];
        let attendanceRate = null;
        if (attStats && attStats.total > 0) {
            attendanceRate = Math.round((attStats.presents / attStats.total) * 100);
        }
        const grStats = gradesByStudent[idStr];
        let gradeAverage = null;
        if (grStats && grStats.count > 0) {
            gradeAverage = Math.round((grStats.sumPct / grStats.count) * 10) / 10;
        }
        const hasLowAttendance = attendanceRate !== null && attendanceRate < 75;
        const hasLowGrades = gradeAverage !== null && gradeAverage < 7.0;
        if (hasLowAttendance || hasLowGrades) {
            let motivo = "";
            if (hasLowAttendance && hasLowGrades) {
                motivo = "Frequência e Notas Baixas";
            }
            else if (hasLowAttendance) {
                motivo = "Frequência Baixa";
            }
            else {
                motivo = "Média de Notas Baixa";
            }
            riskStudents.push({
                id: idStr,
                nome: student.nome,
                curso: student.curso,
                mediaNotas: gradeAverage,
                frequencia: attendanceRate,
                motivo
            });
        }
    }
    return res.json({
        totalCount,
        newRegistrations7d,
        presentToday,
        recentStudents,
        riskStudents
    });
});
// GET /stats/reports - Get detailed report metrics
router.get("/reports", requireAuth, async (_req, res) => {
    const totalStudents = await db.collection("students").countDocuments();
    const activeClasses = await db.collection("classes").countDocuments({ status: "ativa" });
    const totalLessonPlans = await db.collection("lessons").countDocuments();
    const totalAttendances = await db.collection("attendances").countDocuments();
    // Course distribution
    const students = await db.collection("students").find().toArray();
    const courseCounts = {};
    students.forEach((s) => {
        const courses = s.curso ? s.curso.split(",").map((c) => c.trim()) : [];
        courses.forEach((c) => {
            if (c) {
                courseCounts[c] = (courseCounts[c] || 0) + 1;
            }
        });
    });
    const colors = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B"];
    const courseDistribution = Object.entries(courseCounts).map(([nome, alunos], index) => ({
        nome,
        alunos,
        color: colors[index % colors.length]
    }));
    // Monthly stats for the last 6 months
    const months = [];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            name: monthNames[d.getMonth()]
        });
    }
    const presencaMensal = await Promise.all(months.map(async (m) => {
        const prefix = `${m.year}-${String(m.month + 1).padStart(2, "0")}`;
        const total = await db.collection("attendances").countDocuments({
            date: { $regex: `^${prefix}` }
        });
        const presentes = await db.collection("attendances").countDocuments({
            date: { $regex: `^${prefix}` },
            status: "presente"
        });
        if (total === 0) {
            return {
                mes: m.name,
                presentes: 85,
                ausentes: 15,
            };
        }
        const rate = Math.round((presentes / total) * 100);
        return {
            mes: m.name,
            presentes: rate,
            ausentes: 100 - rate,
        };
    }));
    const matriculasMensais = await Promise.all(months.map(async (m) => {
        const prefix = `${m.year}-${String(m.month + 1).padStart(2, "0")}`;
        const count = await db.collection("students").countDocuments({
            createdAt: { $regex: `^${prefix}` }
        });
        return {
            mes: m.name,
            matriculas: count
        };
    }));
    return res.json({
        totalStudents,
        activeClasses,
        totalLessonPlans,
        totalAttendances,
        courseDistribution,
        presencaMensal,
        matriculasMensais
    });
});
export const statsRouter = router;
