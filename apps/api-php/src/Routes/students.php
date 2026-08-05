<?php
/**
 * Rotas de Alunos
 * GET    /students     - Listar alunos
 * POST   /students     - Cadastrar aluno
 * PUT    /students/:id - Atualizar aluno
 * DELETE /students/:id - Excluir aluno
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

// GET /students
Router::get('/students', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();

    $students = $db->selectCollection('students')->find([], ['sort' => ['created_at' => -1]]);
    $list = [];
    foreach ($students as $s) {
        $s = (array)$s;
        $list[] = [
            'id'             => $s['id'] ?? (string)($s['_id'] ?? ''),
            'nome'           => $s['nome'] ?? '',
            'cpf'            => $s['cpf'] ?? '',
            'dataNascimento' => $s['data_nascimento'] ?? $s['dataNascimento'] ?? '',
            'email'          => $s['email'] ?? '',
            'telefone'       => $s['telefone'] ?? '',
            'endereco'       => $s['endereco'] ?? '',
            'curso'          => $s['curso'] ?? '',
            'classId'        => $s['class_id'] ?? $s['classId'] ?? null,
            'classIds'       => $s['class_ids'] ?? $s['classIds'] ?? [],
            'createdAt'      => $s['created_at'] ?? '',
        ];
    }

    // Professor: filtrar alunos apenas das suas turmas
    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $c = (array)$c;
            $classIds[] = $c['id'] ?? (string)($c['_id'] ?? '');
        }

        $list = array_values(array_filter($list, function ($s) use ($classIds) {
            if (in_array($s['classId'], $classIds)) return true;
            foreach ($s['classIds'] as $cid) {
                if (in_array($cid, $classIds)) return true;
            }
            return false;
        }));
    }

    Response::json(['students' => $list]);
});

// POST /students
Router::post('/students', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');

    $body = Auth::getBody();
    $db = Database::getDb();
    $id = Database::uuid();

    $row = [
        'id'              => $id,
        'nome'            => trim($body['nome'] ?? ''),
        'cpf'             => trim($body['cpf'] ?? ''),
        'data_nascimento' => $body['dataNascimento'] ?? $body['data_nascimento'] ?? '',
        'email'           => $body['email'] ?? '',
        'telefone'        => $body['telefone'] ?? '',
        'endereco'        => $body['endereco'] ?? '',
        'curso'           => $body['curso'] ?? '',
        'class_id'        => $body['classId'] ?? $body['class_id'] ?? null,
        'class_ids'       => $body['classIds'] ?? $body['class_ids'] ?? [],
        'created_at'      => date('c'),
    ];

    if (empty($row['nome']) || empty($row['cpf'])) {
        Response::error('Nome e CPF são obrigatórios', 400);
    }

    $db->selectCollection('students')->insertOne($row);

    AuditLog::create($user->sub, 'CREATE', 'student', "Cadastrou o aluno {$row['nome']} (CPF: {$row['cpf']})", $id);

    Response::json(['student' => array_merge($body, ['id' => $id, 'createdAt' => $row['created_at']])], 201);
});

// PUT /students/:id
Router::put('/students/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');

    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $update = [];
    if (isset($body['nome'])) $update['nome'] = $body['nome'];
    if (isset($body['cpf'])) $update['cpf'] = $body['cpf'];
    if (isset($body['dataNascimento'])) $update['data_nascimento'] = $body['dataNascimento'];
    if (isset($body['email'])) $update['email'] = $body['email'];
    if (isset($body['telefone'])) $update['telefone'] = $body['telefone'];
    if (isset($body['endereco'])) $update['endereco'] = $body['endereco'];
    if (isset($body['curso'])) $update['curso'] = $body['curso'];
    if (isset($body['classId'])) $update['class_id'] = $body['classId'];
    if (isset($body['classIds'])) $update['class_ids'] = $body['classIds'];

    $db->selectCollection('students')->updateOne(['id' => $id], ['$set' => $update]);

    $student = $db->selectCollection('students')->findOne(['id' => $id]);
    $name = $student ? ((array)$student)['nome'] ?? 'Desconhecido' : 'Desconhecido';

    AuditLog::create($user->sub, 'UPDATE', 'student', "Atualizou dados do aluno {$name}", $id);

    Response::json(['success' => true]);
});

// DELETE /students/:id
Router::delete('/students/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');

    $id = $params[0];
    $db = Database::getDb();

    $student = $db->selectCollection('students')->findOne(['id' => $id]);
    $name = $student ? ((array)$student)['nome'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('students')->deleteOne(['id' => $id]);
    $db->selectCollection('attendances')->deleteMany(['student_id' => $id]);

    AuditLog::create($user->sub, 'DELETE', 'student', "Excluiu o aluno {$name}", $id);

    Response::json(['success' => true]);
});
