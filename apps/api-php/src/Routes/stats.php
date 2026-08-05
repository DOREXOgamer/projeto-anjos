<?php
/**
 * Rotas de Estatísticas e Dashboard
 * GET /stats          - Indicadores principais do dashboard
 * GET /stats/students - Estatísticas de alunos
 * GET /stats/reports  - Relatórios detalhados
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;

// GET /stats
Router::get('/stats', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();

    $todayStr = date('Y-m-d');
    $students = iterator_to_array($db->selectCollection('students')->find());
    $attendances = iterator_to_array($db->selectCollection('attendances')->find());
    $lessons = iterator_to_array($db->selectCollection('lessons')->find());

    $totalAlunos = 0;
    $presentesHoje = 0;
    $aulasDoDia = 0;

    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $classIds[] = ((array)$c)['id'] ?? (string)(((array)$c)['_id'] ?? '');
        }

        $totalAlunos = count(array_filter($students, function ($s) use ($classIds) {
            $s = (array)$s;
            $cid = $s['class_id'] ?? $s['classId'] ?? '';
            $cids = $s['class_ids'] ?? $s['classIds'] ?? [];
            return in_array($cid, $classIds) || count(array_intersect($cids, $classIds)) > 0;
        }));

        $presentesHoje = count(array_filter($attendances, function ($a) use ($todayStr, $classIds) {
            $a = (array)$a;
            return ($a['date'] ?? '') === $todayStr
                && in_array($a['status'] ?? '', ['presente', 'PRESENT'])
                && in_array($a['class_id'] ?? '', $classIds);
        }));

        $aulasDoDia = count(array_filter($lessons, function ($l) use ($todayStr, $classIds) {
            $l = (array)$l;
            return ($l['data'] ?? '') === $todayStr && in_array($l['class_id'] ?? '', $classIds);
        }));
    } else {
        $totalAlunos = count($students);
        $presentesHoje = count(array_filter($attendances, function ($a) use ($todayStr) {
            $a = (array)$a;
            return ($a['date'] ?? '') === $todayStr && in_array($a['status'] ?? '', ['presente', 'PRESENT']);
        }));
        $aulasDoDia = count(array_filter($lessons, function ($l) use ($todayStr) {
            $l = (array)$l;
            return ($l['data'] ?? '') === $todayStr;
        }));
    }

    // Presença semanal (Seg-Sex)
    $today = new \DateTime();
    $dayOfWeek = (int)$today->format('N');
    $monday = clone $today;
    $monday->modify('-' . ($dayOfWeek - 1) . ' days');

    $weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    $weeklyPresenca = [];
    foreach ($weekdays as $i => $dia) {
        $d = clone $monday;
        $d->modify('+' . $i . ' days');
        $dateStr = $d->format('Y-m-d');

        $dayAtts = array_filter($attendances, fn($a) => ((array)$a)['date'] === $dateStr);
        $presentes = count(array_filter($dayAtts, fn($a) => in_array(((array)$a)['status'] ?? '', ['presente', 'PRESENT'])));
        $ausentes = count(array_filter($dayAtts, fn($a) => in_array(((array)$a)['status'] ?? '', ['ausente', 'ABSENT'])));

        $weeklyPresenca[] = ['dia' => $dia, 'presentes' => $presentes, 'ausentes' => $ausentes];
    }

    // Alunos em risco (frequência < 75%)
    $attendanceByStudent = [];
    foreach ($attendances as $att) {
        $att = (array)$att;
        $sid = $att['student_id'] ?? $att['studentId'] ?? '';
        if (!isset($attendanceByStudent[$sid])) {
            $attendanceByStudent[$sid] = ['total' => 0, 'presents' => 0];
        }
        $attendanceByStudent[$sid]['total']++;
        if (in_array($att['status'] ?? '', ['presente', 'PRESENT'])) {
            $attendanceByStudent[$sid]['presents']++;
        }
    }

    $riskStudents = [];
    foreach ($students as $student) {
        $student = (array)$student;
        $sid = $student['id'] ?? (string)($student['_id'] ?? '');
        $stats = $attendanceByStudent[$sid] ?? null;
        if ($stats && $stats['total'] > 0) {
            $rate = round(($stats['presents'] / $stats['total']) * 100);
            if ($rate < 75) {
                $riskStudents[] = [
                    'id'         => $sid,
                    'nome'       => $student['nome'] ?? '',
                    'curso'      => $student['curso'] ?? '',
                    'mediaNotas' => null,
                    'frequencia' => $rate,
                    'motivo'     => 'Frequência Baixa',
                ];
            }
        }
    }

    Response::json([
        'stats' => [
            'totalAlunos'   => $totalAlunos,
            'presentesHoje' => $presentesHoje,
            'aulasDoDia'    => $aulasDoDia,
        ],
        'weeklyPresenca' => $weeklyPresenca,
        'riskStudents'   => $riskStudents,
    ]);
});

// GET /stats/students
Router::get('/stats/students', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();

    $students = iterator_to_array($db->selectCollection('students')->find());
    $attendances = iterator_to_array($db->selectCollection('attendances')->find());

    $filteredStudents = $students;
    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $classIds[] = ((array)$c)['id'] ?? (string)(((array)$c)['_id'] ?? '');
        }
        $filteredStudents = array_filter($students, function ($s) use ($classIds) {
            $s = (array)$s;
            return in_array($s['class_id'] ?? '', $classIds) || count(array_intersect($s['class_ids'] ?? [], $classIds)) > 0;
        });
    }

    $totalCount = count($filteredStudents);
    $sevenDaysAgo = (new \DateTime())->modify('-7 days')->format('c');
    $newRegistrations7d = count(array_filter($filteredStudents, function ($s) use ($sevenDaysAgo) {
        $s = (array)$s;
        return ($s['created_at'] ?? '') >= $sevenDaysAgo;
    }));

    $todayStr = date('Y-m-d');
    $presentToday = count(array_filter($attendances, function ($a) use ($todayStr) {
        $a = (array)$a;
        return ($a['date'] ?? '') === $todayStr && in_array($a['status'] ?? '', ['presente', 'PRESENT']);
    }));

    $recentStudents = array_slice(array_values($filteredStudents), 0, 10);
    $recentStudents = array_map(function ($s) {
        $s = (array)$s;
        return ['id' => $s['id'] ?? '', 'name' => $s['nome'] ?? '', 'createdAt' => $s['created_at'] ?? ''];
    }, $recentStudents);

    Response::json([
        'totalCount'         => $totalCount,
        'newRegistrations7d' => $newRegistrations7d,
        'presentToday'       => $presentToday,
        'recentStudents'     => $recentStudents,
        'riskStudents'       => [],
    ]);
});

// GET /stats/reports
Router::get('/stats/reports', function () {
    Auth::requireAuth();
    $db = Database::getDb();

    $totalStudents = $db->selectCollection('students')->countDocuments();
    $activeClasses = $db->selectCollection('classes')->countDocuments(['status' => 'ativa']);
    $totalLessonPlans = $db->selectCollection('lessons')->countDocuments();
    $totalAttendances = $db->selectCollection('attendances')->countDocuments();

    // Distribuição por curso
    $students = $db->selectCollection('students')->find([], ['projection' => ['curso' => 1]]);
    $courseCounts = [];
    foreach ($students as $s) {
        $s = (array)$s;
        $courses = array_map('trim', explode(',', $s['curso'] ?? ''));
        foreach ($courses as $c) {
            if (!empty($c)) {
                $courseCounts[$c] = ($courseCounts[$c] ?? 0) + 1;
            }
        }
    }

    $colors = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];
    $courseDistribution = [];
    $i = 0;
    foreach ($courseCounts as $nome => $alunos) {
        $courseDistribution[] = ['nome' => $nome, 'alunos' => $alunos, 'color' => $colors[$i % count($colors)]];
        $i++;
    }

    // Presença mensal (últimos 6 meses)
    $monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    $presencaMensal = [];
    $matriculasMensais = [];

    for ($m = 5; $m >= 0; $m--) {
        $d = new \DateTime();
        $d->modify("-{$m} months");
        $year = $d->format('Y');
        $month = $d->format('m');
        $monthName = $monthNames[(int)$month - 1];
        $prefix = "{$year}-{$month}";

        $monthAtts = iterator_to_array($db->selectCollection('attendances')->find([
            'date' => ['$gte' => "{$prefix}-01", '$lte' => "{$prefix}-31"],
        ]));

        $total = count($monthAtts);
        if ($total > 0) {
            $presentesCount = count(array_filter($monthAtts, fn($a) => in_array(((array)$a)['status'] ?? '', ['presente', 'PRESENT'])));
            $rate = round(($presentesCount / $total) * 100);
            $presencaMensal[] = ['mes' => $monthName, 'presentes' => $rate, 'ausentes' => 100 - $rate];
        } else {
            $presencaMensal[] = ['mes' => $monthName, 'presentes' => 0, 'ausentes' => 0];
        }

        $monthStudents = $db->selectCollection('students')->countDocuments([
            'created_at' => ['$gte' => "{$prefix}-01T00:00:00", '$lte' => "{$prefix}-31T23:59:59"],
        ]);
        $matriculasMensais[] = ['mes' => $monthName, 'matriculas' => $monthStudents];
    }

    Response::json([
        'totalStudents'      => $totalStudents,
        'activeClasses'      => $activeClasses,
        'totalLessonPlans'   => $totalLessonPlans,
        'totalAttendances'   => $totalAttendances,
        'courseDistribution'  => $courseDistribution,
        'presencaMensal'     => $presencaMensal,
        'matriculasMensais'  => $matriculasMensais,
    ]);
});
