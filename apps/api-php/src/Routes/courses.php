<?php
/**
 * Rotas de Cursos
 * GET    /courses     - Listar cursos
 * POST   /courses     - Criar curso
 * PUT    /courses/:id - Atualizar curso
 * DELETE /courses/:id - Excluir curso
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

Router::get('/courses', function () {
    Auth::requireAuth();
    $db = Database::getDb();
    $docs = $db->selectCollection('courses')->find([], ['sort' => ['created_at' => -1]]);

    $courses = [];
    foreach ($docs as $c) {
        $c = (array)$c;
        $courses[] = [
            'id'          => $c['id'] ?? (string)($c['_id'] ?? ''),
            'name'        => $c['name'] ?? '',
            'description' => $c['description'] ?? '',
        ];
    }

    Response::json(['courses' => $courses]);
});

Router::post('/courses', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');
    $body = Auth::getBody();
    $db = Database::getDb();
    $id = Database::uuid();

    $row = [
        'id'          => $id,
        'name'        => trim($body['name'] ?? ''),
        'description' => $body['description'] ?? '',
        'created_at'  => date('c'),
    ];

    $db->selectCollection('courses')->insertOne($row);
    AuditLog::create($user->sub, 'CREATE', 'course', "Criou o curso {$row['name']}", $id);

    Response::json(['course' => ['id' => $id, 'name' => $row['name'], 'description' => $row['description']]], 201);
});

Router::put('/courses/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');
    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $update = [];
    if (isset($body['name'])) $update['name'] = $body['name'];
    if (isset($body['description'])) $update['description'] = $body['description'];

    $db->selectCollection('courses')->updateOne(['id' => $id], ['$set' => $update]);

    $doc = $db->selectCollection('courses')->findOne(['id' => $id]);
    $name = $doc ? ((array)$doc)['name'] ?? 'Desconhecido' : 'Desconhecido';
    AuditLog::create($user->sub, 'UPDATE', 'course', "Atualizou o curso {$name}", $id);

    Response::json(['success' => true]);
});

Router::delete('/courses/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');
    $id = $params[0];
    $db = Database::getDb();

    $doc = $db->selectCollection('courses')->findOne(['id' => $id]);
    $name = $doc ? ((array)$doc)['name'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('courses')->deleteOne(['id' => $id]);
    AuditLog::create($user->sub, 'DELETE', 'course', "Excluiu o curso {$name}", $id);

    Response::json(['success' => true]);
});
