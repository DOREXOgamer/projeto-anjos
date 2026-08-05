<?php
/**
 * Rotas de Turmas
 * GET    /classes     - Listar turmas
 * POST   /classes     - Criar turma
 * PUT    /classes/:id - Atualizar turma
 * DELETE /classes/:id - Excluir turma
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

// GET /classes
Router::get('/classes', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();

    $filter = [];
    if (($user->role ?? '') === 'TEACHER') {
        $filter = ['professor_id' => $user->sub];
    }

    $docs = $db->selectCollection('classes')->find($filter, ['sort' => ['created_at' => -1]]);
    $classes = [];
    foreach ($docs as $c) {
        $c = (array)$c;
        $classes[] = [
            'id'                 => $c['id'] ?? (string)($c['_id'] ?? ''),
            'nome'               => $c['nome'] ?? '',
            'curso'              => $c['curso'] ?? '',
            'courseId'            => $c['course_id'] ?? $c['courseId'] ?? '',
            'horario'            => $c['horario'] ?? '',
            'diasSemana'         => $c['dias_semana'] ?? $c['diasSemana'] ?? [],
            'professor'          => $c['professor'] ?? '',
            'professorId'        => $c['professor_id'] ?? $c['professorId'] ?? '',
            'capacidade'         => $c['capacidade'] ?? 0,
            'alunosMatriculados' => $c['alunos_matriculados'] ?? $c['alunosMatriculados'] ?? 0,
            'sala'               => $c['sala'] ?? '',
            'status'             => $c['status'] ?? 'ativa',
            'createdAt'          => $c['created_at'] ?? '',
        ];
    }

    Response::json(['classes' => $classes]);
});

// POST /classes
Router::post('/classes', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');

    $body = Auth::getBody();
    $db = Database::getDb();
    $id = Database::uuid();

    $row = [
        'id'                   => $id,
        'nome'                 => trim($body['nome'] ?? ''),
        'curso'                => $body['curso'] ?? '',
        'course_id'            => $body['courseId'] ?? null,
        'horario'              => $body['horario'] ?? '',
        'dias_semana'          => $body['diasSemana'] ?? [],
        'professor'            => $body['professor'] ?? '',
        'professor_id'         => $body['professorId'] ?? null,
        'capacidade'           => (int)($body['capacidade'] ?? 0),
        'alunos_matriculados'  => 0,
        'sala'                 => $body['sala'] ?? '',
        'status'               => $body['status'] ?? 'ativa',
        'created_at'           => date('c'),
    ];

    if (empty($row['nome'])) {
        Response::error('Nome da turma é obrigatório', 400);
    }

    $db->selectCollection('classes')->insertOne($row);

    AuditLog::create($user->sub, 'CREATE', 'class', "Criou a turma {$row['nome']} para o curso {$row['curso']}", $id);

    Response::json(['class' => array_merge($body, ['id' => $id, 'alunosMatriculados' => 0, 'createdAt' => $row['created_at']])], 201);
});

// PUT /classes/:id
Router::put('/classes/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');

    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $update = [];
    if (isset($body['nome'])) $update['nome'] = $body['nome'];
    if (isset($body['curso'])) $update['curso'] = $body['curso'];
    if (isset($body['courseId'])) $update['course_id'] = $body['courseId'];
    if (isset($body['horario'])) $update['horario'] = $body['horario'];
    if (isset($body['diasSemana'])) $update['dias_semana'] = $body['diasSemana'];
    if (isset($body['professor'])) $update['professor'] = $body['professor'];
    if (isset($body['professorId'])) $update['professor_id'] = $body['professorId'];
    if (isset($body['capacidade'])) $update['capacidade'] = (int)$body['capacidade'];
    if (isset($body['sala'])) $update['sala'] = $body['sala'];
    if (isset($body['status'])) $update['status'] = $body['status'];

    $db->selectCollection('classes')->updateOne(['id' => $id], ['$set' => $update]);

    $classDoc = $db->selectCollection('classes')->findOne(['id' => $id]);
    $name = $classDoc ? ((array)$classDoc)['nome'] ?? 'Desconhecido' : 'Desconhecido';

    AuditLog::create($user->sub, 'UPDATE', 'class', "Atualizou a turma {$name}", $id);

    Response::json(['success' => true]);
});

// DELETE /classes/:id
Router::delete('/classes/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');

    $id = $params[0];
    $db = Database::getDb();

    $classDoc = $db->selectCollection('classes')->findOne(['id' => $id]);
    $name = $classDoc ? ((array)$classDoc)['nome'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('classes')->deleteOne(['id' => $id]);
    $db->selectCollection('attendances')->deleteMany(['class_id' => $id]);
    $db->selectCollection('lessons')->deleteMany(['class_id' => $id]);

    AuditLog::create($user->sub, 'DELETE', 'class', "Excluiu a turma {$name}", $id);

    Response::json(['success' => true]);
});
