<?php
/**
 * Rotas de Notas
 * GET    /grades     - Listar notas
 * POST   /grades     - Lançar nota
 * PUT    /grades/:id - Editar nota
 * DELETE /grades/:id - Excluir nota
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

Router::get('/grades', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();
    $query = Auth::getQuery();

    $filter = [];
    if (!empty($query['classId'])) $filter['class_id'] = $query['classId'];
    if (!empty($query['studentId'])) $filter['student_id'] = $query['studentId'];

    // Professor: filtrar por suas turmas
    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $classIds[] = ((array)$c)['id'] ?? (string)(((array)$c)['_id'] ?? '');
        }
        if (!empty($query['classId'])) {
            if (!in_array($query['classId'], $classIds)) {
                Response::json(['grades' => []]);
            }
        } else {
            $filter['class_id'] = ['$in' => $classIds];
        }
    }

    $docs = $db->selectCollection('grades')->find($filter);

    // Mapa de alunos
    $studentDocs = $db->selectCollection('students')->find([], ['projection' => ['id' => 1, 'nome' => 1]]);
    $studentMap = [];
    foreach ($studentDocs as $s) {
        $s = (array)$s;
        $studentMap[$s['id'] ?? (string)($s['_id'] ?? '')] = $s['nome'] ?? '';
    }

    $grades = [];
    foreach ($docs as $g) {
        $g = (array)$g;
        $sid = $g['student_id'] ?? $g['studentId'] ?? '';
        $grades[] = [
            'id'          => $g['id'] ?? (string)($g['_id'] ?? ''),
            'studentId'   => $sid,
            'studentName' => $studentMap[$sid] ?? 'Aluno não encontrado',
            'classId'     => $g['class_id'] ?? $g['classId'] ?? '',
            'disciplina'  => $g['disciplina'] ?? '',
            'tipo'        => $g['tipo'] ?? '',
            'nota'        => $g['nota'] ?? 0,
            'notaMaxima'  => $g['nota_maxima'] ?? $g['notaMaxima'] ?? 0,
            'data'        => $g['date'] ?? $g['data'] ?? '',
            'observacoes' => $g['observacoes'] ?? '',
            'professorId' => $g['professor_id'] ?? $g['professorId'] ?? '',
            'professor'   => $g['professor'] ?? '',
            'createdAt'   => $g['created_at'] ?? '',
        ];
    }

    Response::json(['grades' => $grades]);
});

Router::post('/grades', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'TEACHER');
    $body = Auth::getBody();
    $db = Database::getDb();

    $professorDoc = $db->selectCollection('users')->findOne(['id' => $user->sub]);
    $professorName = $professorDoc ? ((array)$professorDoc)['name'] ?? 'Desconhecido' : 'Desconhecido';
    $id = Database::uuid();

    $row = [
        'id'           => $id,
        'student_id'   => $body['studentId'] ?? '',
        'class_id'     => $body['classId'] ?? '',
        'disciplina'   => $body['disciplina'] ?? '',
        'tipo'         => $body['tipo'] ?? '',
        'nota'         => (float)($body['nota'] ?? 0),
        'nota_maxima'  => (float)($body['notaMaxima'] ?? 0),
        'date'         => $body['data'] ?? '',
        'observacoes'  => $body['observacoes'] ?? '',
        'professor_id' => $user->sub,
        'professor'    => $professorName,
        'created_at'   => date('c'),
    ];

    $db->selectCollection('grades')->insertOne($row);

    $studentDoc = $db->selectCollection('students')->findOne(['id' => $body['studentId'] ?? '']);
    $studentName = $studentDoc ? ((array)$studentDoc)['nome'] ?? 'Desconhecido' : 'Desconhecido';
    AuditLog::create($user->sub, 'CREATE', 'grade', "Lançou nota {$row['nota']}/{$row['nota_maxima']} para o aluno {$studentName}", $id);

    Response::json(['grade' => array_merge($body, ['id' => $id, 'professorId' => $user->sub, 'professor' => $professorName, 'createdAt' => $row['created_at']])], 201);
});

Router::put('/grades/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'TEACHER');
    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $existing = $db->selectCollection('grades')->findOne(['id' => $id]);
    if (!$existing) {
        Response::error('Nota não encontrada', 404);
    }
    $existing = (array)$existing;

    if (($user->role ?? '') === 'TEACHER' && ($existing['professor_id'] ?? '') !== $user->sub) {
        Response::error('Acesso negado: Você só pode editar notas lançadas por você mesmo.', 403);
    }

    $update = [];
    if (isset($body['studentId'])) $update['student_id'] = $body['studentId'];
    if (isset($body['classId'])) $update['class_id'] = $body['classId'];
    if (isset($body['disciplina'])) $update['disciplina'] = $body['disciplina'];
    if (isset($body['tipo'])) $update['tipo'] = $body['tipo'];
    if (isset($body['nota'])) $update['nota'] = (float)$body['nota'];
    if (isset($body['notaMaxima'])) $update['nota_maxima'] = (float)$body['notaMaxima'];
    if (isset($body['data'])) $update['date'] = $body['data'];
    if (isset($body['observacoes'])) $update['observacoes'] = $body['observacoes'];

    $db->selectCollection('grades')->updateOne(['id' => $id], ['$set' => $update]);
    Response::json(['success' => true]);
});

Router::delete('/grades/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'TEACHER');
    $id = $params[0];
    $db = Database::getDb();

    $existing = $db->selectCollection('grades')->findOne(['id' => $id]);
    if (!$existing) {
        Response::error('Nota não encontrada', 404);
    }

    if (($user->role ?? '') === 'TEACHER' && (((array)$existing)['professor_id'] ?? '') !== $user->sub) {
        Response::error('Acesso negado: Você só pode excluir notas lançadas por você mesmo.', 403);
    }

    $db->selectCollection('grades')->deleteOne(['id' => $id]);
    Response::json(['success' => true]);
});
