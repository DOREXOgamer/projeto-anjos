<?php
/**
 * Rotas de Frequência / Presença
 * GET  /attendance - Consultar registros de presença
 * POST /attendance - Registrar chamada em lote
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;

// GET /attendance
Router::get('/attendance', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();
    $query = Auth::getQuery();

    $filter = [];
    if (!empty($query['date'])) $filter['date'] = $query['date'];
    if (!empty($query['classId'])) $filter['class_id'] = $query['classId'];
    if (!empty($query['startDate'])) $filter['date']['$gte'] = $query['startDate'];
    if (!empty($query['endDate'])) $filter['date']['$lte'] = $query['endDate'];

    // Professor: filtrar por suas turmas
    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $classIds[] = ((array)$c)['id'] ?? (string)(((array)$c)['_id'] ?? '');
        }
        if (!empty($query['classId'])) {
            if (!in_array($query['classId'], $classIds)) {
                Response::json(['records' => []]);
            }
        } else {
            $filter['class_id'] = ['$in' => $classIds];
        }
    }

    $docs = $db->selectCollection('attendances')->find($filter);

    // Mapa de alunos para nomes
    $studentDocs = $db->selectCollection('students')->find([], ['projection' => ['id' => 1, 'nome' => 1]]);
    $studentMap = [];
    foreach ($studentDocs as $s) {
        $s = (array)$s;
        $sid = $s['id'] ?? (string)($s['_id'] ?? '');
        $studentMap[$sid] = $s['nome'] ?? '';
    }

    $records = [];
    foreach ($docs as $a) {
        $a = (array)$a;
        $studentId = $a['student_id'] ?? $a['studentId'] ?? '';
        $status = ($a['status'] === 'presente' || $a['status'] === 'PRESENT') ? 'PRESENT' : 'ABSENT';

        $records[] = [
            'id'        => $a['id'] ?? (string)($a['_id'] ?? ''),
            'alunoId'   => $studentId,
            'studentId' => $studentId,
            'data'      => $a['date'] ?? '',
            'date'      => $a['date'] ?? '',
            'status'    => $status,
            'classId'   => $a['class_id'] ?? $a['classId'] ?? '',
            'student'   => isset($studentMap[$studentId]) ? ['name' => $studentMap[$studentId]] : null,
        ];
    }

    Response::json(['records' => $records]);
});

// POST /attendance
Router::post('/attendance', function () {
    Auth::requireAuth();
    $body = Auth::getBody();
    $db = Database::getDb();

    $date = $body['date'] ?? '';
    $classId = $body['classId'] ?? '';
    $records = $body['records'] ?? [];

    if (empty($date) || !is_array($records)) {
        Response::error('Data e registros são obrigatórios', 400);
    }

    // Remover registros anteriores para esses alunos nessa data
    $studentIds = array_map(fn($r) => $r['studentId'] ?? $r['alunoId'] ?? '', $records);
    if (count($studentIds) > 0) {
        $db->selectCollection('attendances')->deleteMany([
            'date'       => $date,
            'student_id' => ['$in' => $studentIds],
        ]);
    }

    // Inserir novos registros
    if (count($records) > 0) {
        $documents = [];
        foreach ($records as $r) {
            $rawStatus = $r['status'] ?? 'ausente';
            $status = ($rawStatus === 'PRESENT' || $rawStatus === 'presente') ? 'presente' : 'ausente';

            $documents[] = [
                'id'         => Database::uuid(),
                'student_id' => $r['studentId'] ?? $r['alunoId'] ?? '',
                'class_id'   => $classId,
                'date'       => $date,
                'status'     => $status,
                'created_at' => date('c'),
            ];
        }
        $db->selectCollection('attendances')->insertMany($documents);
    }

    Response::json(['success' => true]);
});
