<?php
/**
 * Rotas de Eventos / Calendário
 * GET    /events     - Listar eventos
 * POST   /events     - Criar evento
 * PUT    /events/:id - Atualizar evento
 * DELETE /events/:id - Excluir evento
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

Router::get('/events', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();

    $docs = $db->selectCollection('events')->find([], ['sort' => ['date' => 1]]);
    $list = [];
    foreach ($docs as $e) {
        $e = (array)$e;
        $list[] = [
            'id'        => $e['id'] ?? (string)($e['_id'] ?? ''),
            'titulo'    => $e['title'] ?? $e['titulo'] ?? '',
            'descricao' => $e['description'] ?? $e['descricao'] ?? '',
            'data'      => $e['date'] ?? $e['data'] ?? '',
            'horario'   => $e['time'] ?? $e['horario'] ?? '',
            'tipo'      => $e['type'] ?? $e['tipo'] ?? '',
            'turmaId'   => $e['turma_id'] ?? $e['turmaId'] ?? '',
        ];
    }

    // Professor: filtrar por suas turmas
    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $classIds[] = ((array)$c)['id'] ?? (string)(((array)$c)['_id'] ?? '');
        }

        $list = array_values(array_filter($list, function ($e) use ($classIds) {
            return empty($e['turmaId']) || in_array($e['turmaId'], $classIds);
        }));
    }

    Response::json(['events' => $list]);
});

Router::post('/events', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');
    $body = Auth::getBody();
    $db = Database::getDb();
    $id = Database::uuid();

    $row = [
        'id'          => $id,
        'title'       => $body['titulo'] ?? '',
        'description' => $body['descricao'] ?? '',
        'date'        => $body['data'] ?? '',
        'time'        => $body['horario'] ?? '',
        'type'        => $body['tipo'] ?? '',
        'created_at'  => date('c'),
    ];

    $db->selectCollection('events')->insertOne($row);
    AuditLog::create($user->sub, 'CREATE', 'event', "Criou o evento {$row['title']} para a data {$row['date']}", $id);

    Response::json(['event' => array_merge($body, ['id' => $id])], 201);
});

Router::put('/events/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');
    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $update = [];
    if (isset($body['titulo'])) $update['title'] = $body['titulo'];
    if (isset($body['descricao'])) $update['description'] = $body['descricao'];
    if (isset($body['data'])) $update['date'] = $body['data'];
    if (isset($body['horario'])) $update['time'] = $body['horario'];
    if (isset($body['tipo'])) $update['type'] = $body['tipo'];

    $db->selectCollection('events')->updateOne(['id' => $id], ['$set' => $update]);

    $doc = $db->selectCollection('events')->findOne(['id' => $id]);
    $name = $doc ? ((array)$doc)['title'] ?? 'Desconhecido' : 'Desconhecido';
    AuditLog::create($user->sub, 'UPDATE', 'event', "Atualizou o evento {$name}", $id);

    Response::json(['success' => true]);
});

Router::delete('/events/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');
    $id = $params[0];
    $db = Database::getDb();

    $doc = $db->selectCollection('events')->findOne(['id' => $id]);
    $name = $doc ? ((array)$doc)['title'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('events')->deleteOne(['id' => $id]);
    AuditLog::create($user->sub, 'DELETE', 'event', "Excluiu o evento {$name}", $id);

    Response::json(['success' => true]);
});
