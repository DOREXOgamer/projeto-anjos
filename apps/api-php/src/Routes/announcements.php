<?php
/**
 * Rotas de Comunicados / Avisos
 * GET    /announcements     - Listar comunicados
 * POST   /announcements     - Publicar comunicado
 * PUT    /announcements/:id - Editar comunicado
 * DELETE /announcements/:id - Excluir comunicado
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

Router::get('/announcements', function () {
    Auth::requireAuth();
    $db = Database::getDb();

    $docs = $db->selectCollection('announcements')->find([], ['sort' => ['created_at' => -1], 'limit' => 20]);

    // Mapa de autores
    $userDocs = $db->selectCollection('users')->find([], ['projection' => ['id' => 1, 'name' => 1, 'role' => 1]]);
    $userMap = [];
    foreach ($userDocs as $u) {
        $u = (array)$u;
        $uid = $u['id'] ?? (string)($u['_id'] ?? '');
        $userMap[$uid] = ['id' => $uid, 'name' => $u['name'] ?? '', 'role' => $u['role'] ?? ''];
    }

    $announcements = [];
    foreach ($docs as $a) {
        $a = (array)$a;
        $authorId = $a['author_id'] ?? $a['authorId'] ?? '';

        $announcements[] = [
            'id'          => $a['id'] ?? (string)($a['_id'] ?? ''),
            'title'       => $a['title'] ?? '',
            'body'        => $a['content'] ?? $a['body'] ?? '',
            'attachments' => $a['attachments'] ?? [],
            'createdAt'   => $a['created_at'] ?? '',
            'author'      => $userMap[$authorId] ?? null,
        ];
    }

    Response::json(['announcements' => $announcements]);
});

Router::post('/announcements', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');
    $body = Auth::getBody();
    $db = Database::getDb();
    $id = Database::uuid();

    $authorDoc = $db->selectCollection('users')->findOne(['id' => $user->sub]);
    $authorName = $authorDoc ? ((array)$authorDoc)['name'] ?? '' : '';

    $row = [
        'id'          => $id,
        'title'       => trim($body['title'] ?? ''),
        'content'     => trim($body['body'] ?? ''),
        'attachments' => $body['attachments'] ?? [],
        'author_id'   => $user->sub,
        'author_name' => $authorName,
        'created_at'  => date('c'),
    ];

    $db->selectCollection('announcements')->insertOne($row);
    AuditLog::create($user->sub, 'CREATE', 'announcement', "Criou o aviso mural: {$row['title']}", $id);

    Response::json(['announcement' => [
        'id'          => $id,
        'title'       => $row['title'],
        'body'        => $row['content'],
        'attachments' => $row['attachments'],
        'authorId'    => $user->sub,
        'createdAt'   => $row['created_at'],
    ]], 201);
});

Router::put('/announcements/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');
    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $existing = $db->selectCollection('announcements')->findOne(['id' => $id]);
    if (!$existing) {
        Response::error('Aviso não encontrado', 404);
    }

    $update = [];
    if (isset($body['title'])) $update['title'] = $body['title'];
    if (isset($body['body'])) $update['content'] = $body['body'];
    if (isset($body['attachments'])) $update['attachments'] = $body['attachments'];

    $db->selectCollection('announcements')->updateOne(['id' => $id], ['$set' => $update]);

    $title = $body['title'] ?? ((array)$existing)['title'] ?? '';
    AuditLog::create($user->sub, 'UPDATE', 'announcement', "Atualizou o aviso mural: {$title}", $id);

    Response::json(['success' => true]);
});

Router::delete('/announcements/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'SECRETARY');
    $id = $params[0];
    $db = Database::getDb();

    $existing = $db->selectCollection('announcements')->findOne(['id' => $id]);
    $title = $existing ? ((array)$existing)['title'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('announcements')->deleteOne(['id' => $id]);
    AuditLog::create($user->sub, 'DELETE', 'announcement', "Excluiu o aviso mural: {$title}", $id);

    Response::json(['success' => true]);
});
