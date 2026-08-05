<?php
/**
 * Rotas de Logs de Auditoria
 * GET /audit-logs - Listar registros de auditoria
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;

Router::get('/audit-logs', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR');
    $db = Database::getDb();

    $docs = $db->selectCollection('audit_logs')->find([], ['sort' => ['timestamp' => -1], 'limit' => 200]);

    // Mapa de usuários
    $userDocs = $db->selectCollection('users')->find([], ['projection' => ['id' => 1, 'name' => 1, 'role' => 1]]);
    $userMap = [];
    foreach ($userDocs as $u) {
        $u = (array)$u;
        $uid = $u['id'] ?? (string)($u['_id'] ?? '');
        $userMap[$uid] = ['name' => $u['name'] ?? 'Desconhecido', 'role' => $u['role'] ?? 'UNKNOWN'];
    }

    $logs = [];
    foreach ($docs as $log) {
        $log = (array)$log;
        $userId = $log['user_id'] ?? '';
        $u = $userMap[$userId] ?? ['name' => 'Desconhecido', 'role' => 'UNKNOWN'];

        $logs[] = [
            'id'          => $log['id'] ?? (string)($log['_id'] ?? ''),
            'userId'      => $userId,
            'userName'    => $u['name'],
            'userRole'    => $u['role'],
            'action'      => $log['action'] ?? '',
            'resource'    => $log['resource'] ?? '',
            'description' => $log['details'] ?? $log['description'] ?? '',
            'targetId'    => $log['resource_id'] ?? $log['targetId'] ?? null,
            'createdAt'   => $log['timestamp'] ?? '',
        ];
    }

    Response::json(['logs' => $logs]);
});
