import { Router } from "express";
import { supabase, Role } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// GET /stats - Get main dashboard statistics and graph data
router.get("/", requireAuth, async (req, res) => {
    let totalAlunos = 0;
    let presentesHoje = 0;
    let aulasDoDia = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: allStudents } = await supabase.from("students").select("*");
    const { data: allAttendances } = await supabase.from("attendances").select("*");
    const { data: allLessons } = await supabase.from("lessons").select("*");
    const studentsList = allStudents || [];
    const attendancesList = allAttendances || [];
    const lessonsList = allLessons || [];
    if (req.user.role === Role.TEACHER) {
        const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("professor_id", req.user.sub);
        const classIds = teacherClasses ? teacherClasses.map(c => c.id) : [];
        const teacherStudents = studentsList.filter(s => classIds.includes(s.class_id) || (Array.isArray(s.class_ids) && s.class_ids.some((id) => classIds.includes(id))));
        totalAlunos = teacherStudents.length;
        presentesHoje = attendancesList.filter(a => a.date === todayStr && (a.status === "presente" || a.status === "PRESENT") && classIds.includes(a.class_id)).length;
        aulasDoDia = lessonsList.filter(l => l.data === todayStr && classIds.includes(l.class_id)).length;
    }
    else {
        totalAlunos = studentsList.length;
        presentesHoje = attendancesList.filter(a => a.date === todayStr && (a.status === "presente" || a.status === "PRESENT")).length;
        aulasDoDia = lessonsList.filter(l => l.data === todayStr).length;
    }
    // Calculate real weekly attendance for current week (Mon..Fri)
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    const weeklyPresenca = weekdays.map((dia, index) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + index);
        const dateStr = d.toISOString().split("T")[0];
        const dayAtts = attendancesList.filter(a => a.date === dateStr);
        const presentes = dayAtts.filter(a => a.status === "presente" || a.status === "PRESENT").length;
        const ausentes = dayAtts.filter(a => a.status === "ausente" || a.status === "ABSENT").length;
        return { dia, presentes, ausentes };
    });
    // Calculate risk students
    const riskStudents = [];
    const attendancesByStudent = {};
    attendancesList.forEach((att) => {
        const sId = att.student_id || att.studentId;
        if (!attendancesByStudent[sId]) {
            attendancesByStudent[sId] = { total: 0, presents: 0 };
        }
        attendancesByStudent[sId].total += 1;
        if (att.status === "presente" || att.status === "PRESENT") {
            attendancesByStudent[sId].presents += 1;
        }
    });
    for (const student of studentsList) {
        const idStr = student.id;
        const attStats = attendancesByStudent[idStr];
        let attendanceRate = null;
        if (attStats && attStats.total > 0) {
            attendanceRate = Math.round((attStats.presents / attStats.total) * 100);
        }
        const hasLowAttendance = attendanceRate !== null && attendanceRate < 75;
        if (hasLowAttendance) {
            riskStudents.push({
                id: idStr,
                nome: student.nome,
                curso: student.curso,
                mediaNotas: null,
                frequencia: attendanceRate,
                motivo: "Frequência Baixa"
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
    const { data: students } = await supabase.from("students").select("*");
    const { data: attendances } = await supabase.from("attendances").select("*");
    const studentsList = students || [];
    const attendancesList = attendances || [];
    let filteredStudents = studentsList;
    if (req.user.role === Role.TEACHER) {
        const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("professor_id", req.user.sub);
        const classIds = teacherClasses ? teacherClasses.map(c => c.id) : [];
        filteredStudents = studentsList.filter(s => classIds.includes(s.class_id) || (Array.isArray(s.class_ids) && s.class_ids.some((id) => classIds.includes(id))));
    }
    const totalCount = filteredStudents.length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newRegistrations7d = filteredStudents.filter(s => s.created_at && new Date(s.created_at) >= sevenDaysAgo).length;
    const todayStr = new Date().toISOString().split("T")[0];
    const presentToday = attendancesList.filter(a => a.date === todayStr && (a.status === "presente" || a.status === "PRESENT")).length;
    const recentStudents = filteredStudents.slice(0, 10).map((s) => ({
        id: s.id,
        name: s.nome,
        createdAt: s.created_at,
    }));
    return res.json({
        totalCount,
        newRegistrations7d,
        presentToday,
        recentStudents,
        riskStudents: []
    });
});
// GET /stats/reports - Get detailed report metrics
router.get("/reports", requireAuth, async (_req, res) => {
    const { count: totalStudents } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: activeClasses } = await supabase.from("classes").select("*", { count: "exact", head: true }).eq("status", "ativa");
    const { count: totalLessonPlans } = await supabase.from("lessons").select("*", { count: "exact", head: true });
    const { count: totalAttendances } = await supabase.from("attendances").select("*", { count: "exact", head: true });
    const { data: students } = await supabase.from("students").select("curso");
    const courseCounts = {};
    if (students) {
        students.forEach((s) => {
            const courses = s.curso ? s.curso.split(",").map((c) => c.trim()) : [];
            courses.forEach((c) => {
                if (c) {
                    courseCounts[c] = (courseCounts[c] || 0) + 1;
                }
            });
        });
    }
    const colors = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B"];
    const courseDistribution = Object.entries(courseCounts).map(([nome, alunos], index) => ({
        nome,
        alunos,
        color: colors[index % colors.length]
    }));
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
        const monthStr = String(m.month + 1).padStart(2, "0");
        const prefix = `${m.year}-${monthStr}`;
        const { data: monthAtts } = await supabase
            .from("attendances")
            .select("status")
            .gte("date", `${prefix}-01`)
            .lte("date", `${prefix}-31`);
        if (!monthAtts || monthAtts.length === 0) {
            return {
                mes: m.name,
                presentes: 0,
                ausentes: 0,
            };
        }
        const total = monthAtts.length;
        const presentesCount = monthAtts.filter((a) => a.status === "presente" || a.status === "PRESENT").length;
        const rate = Math.round((presentesCount / total) * 100);
        return {
            mes: m.name,
            presentes: rate,
            ausentes: 100 - rate,
        };
    }));
    const matriculasMensais = await Promise.all(months.map(async (m) => {
        const monthStr = String(m.month + 1).padStart(2, "0");
        const prefix = `${m.year}-${monthStr}`;
        const { data: monthStudents } = await supabase
            .from("students")
            .select("id")
            .gte("created_at", `${prefix}-01T00:00:00`)
            .lte("created_at", `${prefix}-31T23:59:59`);
        return {
            mes: m.name,
            matriculas: monthStudents ? monthStudents.length : 0
        };
    }));
    return res.json({
        totalStudents: totalStudents || 0,
        activeClasses: activeClasses || 0,
        totalLessonPlans: totalLessonPlans || 0,
        totalAttendances: totalAttendances || 0,
        courseDistribution,
        presencaMensal,
        matriculasMensais
    });
});
export const statsRouter = router;
