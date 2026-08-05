<?php
/**
 * Rotas de Equipe / Colaboradores
 * GET    /users/teachers                  - Listar professores/equipe
 * POST   /users/teachers                  - Cadastrar colaborador
 * PUT    /users/teachers/:id              - Editar colaborador
 * DELETE /users/teachers/:id              - Excluir colaborador
 * POST   /users/teachers/:id/reset-password - Redefinir senha
 * PUT    /users/profile                   - Atualizar perfil próprio
 * POST   /users/change-password           - Alterar própria senha
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

// GET /users/teachers
Router::get('/users/teachers', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR');
    $db = Database::getDb();

    $docs = $db->selectCollection('users')->find(
        ['role' => ['$ne' => 'STUDENT']],
        ['sort' => ['created_at' => -1]]
    );

    $teachers = [];
    foreach ($docs as $t) {
        $t = (array)$t;
        $role = $t['role'] ?? 'TEACHER';
        $teachers[] = [
            'id'             => $t['id'] ?? (string)($t['_id'] ?? ''),
            'name'           => $t['name'] ?? '',
            'email'          => $t['email'] ?? '',
            'role'           => $role,
            'permissions'    => Auth::ROLE_PERMISSIONS[$role] ?? [],
            'active'         => ($t['active'] ?? true) !== false,
            'cpf'            => $t['cpf'] ?? '',
            'telefone'       => $t['telefone'] ?? '',
            'dataNascimento' => $t['data_nascimento'] ?? $t['dataNascimento'] ?? '',
            'endereco'       => $t['endereco'] ?? '',
            'createdAt'      => $t['created_at'] ?? '',
        ];
    }

    Response::json(['teachers' => $teachers]);
});

// POST /users/teachers
Router::post('/users/teachers', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR');

    $body = Auth::getBody();
    $db = Database::getDb();

    $email = trim($body['email'] ?? '');
    $name = trim($body['name'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($name) || empty($email) || strlen($password) < 6) {
        Response::error('Nome, email e senha (min 6 caracteres) são obrigatórios', 400);
    }

    $existing = $db->selectCollection('users')->findOne(['email' => $email]);
    if ($existing) {
        Response::error('Email already in use', 409);
    }

    $role = $body['role'] ?? 'TEACHER';
    $permissions = Auth::ROLE_PERMISSIONS[$role] ?? [];
    $id = Database::uuid();

    $row = [
        'id'              => $id,
        'name'            => $name,
        'email'           => $email,
        'password'        => Auth::hashPassword($password),
        'role'            => $role,
        'permissions'     => $permissions,
        'active'          => true,
        'cpf'             => $body['cpf'] ?? '',
        'telefone'        => $body['telefone'] ?? '',
        'data_nascimento' => $body['dataNascimento'] ?? '',
        'endereco'        => $body['endereco'] ?? '',
        'created_at'      => date('c'),
    ];

    $db->selectCollection('users')->insertOne($row);

    AuditLog::create($user->sub, 'CREATE', 'user', "Cadastrou o colaborador {$name} com o cargo {$role}", $id);

    Response::json([
        'user' => [
            'id'             => $id,
            'name'           => $name,
            'email'          => $email,
            'role'           => $role,
            'permissions'    => $permissions,
            'active'         => true,
            'cpf'            => $body['cpf'] ?? '',
            'telefone'       => $body['telefone'] ?? '',
            'dataNascimento' => $body['dataNascimento'] ?? '',
            'endereco'       => $body['endereco'] ?? '',
            'createdAt'      => $row['created_at'],
        ],
    ], 201);
});

// PUT /users/teachers/:id
Router::put('/users/teachers/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR');

    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $existing = $db->selectCollection('users')->findOne(['id' => $id]);
    if (!$existing) {
        Response::error('Teacher not found', 404);
    }
    $existing = (array)$existing;

    $finalRole = $body['role'] ?? $existing['role'] ?? 'TEACHER';
    $update = [
        'permissions' => Auth::ROLE_PERMISSIONS[$finalRole] ?? [],
        'updated_at'  => date('c'),
    ];

    if (isset($body['name'])) $update['name'] = $body['name'];
    if (isset($body['email'])) $update['email'] = $body['email'];
    if (isset($body['role'])) $update['role'] = $body['role'];
    if (isset($body['active'])) $update['active'] = (bool)$body['active'];
    if (isset($body['cpf'])) $update['cpf'] = $body['cpf'];
    if (isset($body['telefone'])) $update['telefone'] = $body['telefone'];
    if (isset($body['dataNascimento'])) $update['data_nascimento'] = $body['dataNascimento'];
    if (isset($body['endereco'])) $update['endereco'] = $body['endereco'];

    $db->selectCollection('users')->updateOne(['id' => $id], ['$set' => $update]);

    $updated = (array)$db->selectCollection('users')->findOne(['id' => $id]);

    AuditLog::create($user->sub, 'UPDATE', 'user', "Atualizou o colaborador {$updated['name']} (cargo: {$updated['role']})", $id);

    $updatedRole = $updated['role'] ?? 'TEACHER';
    Response::json([
        'user' => [
            'id'             => $updated['id'] ?? $id,
            'name'           => $updated['name'] ?? '',
            'email'          => $updated['email'] ?? '',
            'role'           => $updatedRole,
            'permissions'    => Auth::ROLE_PERMISSIONS[$updatedRole] ?? [],
            'active'         => ($updated['active'] ?? true) !== false,
            'cpf'            => $updated['cpf'] ?? '',
            'telefone'       => $updated['telefone'] ?? '',
            'dataNascimento' => $updated['data_nascimento'] ?? $updated['dataNascimento'] ?? '',
            'endereco'       => $updated['endereco'] ?? '',
            'createdAt'      => $updated['created_at'] ?? '',
        ],
    ]);
});

// DELETE /users/teachers/:id
Router::delete('/users/teachers/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR');

    $id = $params[0];
    $db = Database::getDb();

    $existing = $db->selectCollection('users')->findOne(['id' => $id]);
    $name = $existing ? ((array)$existing)['name'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('users')->deleteOne(['id' => $id]);

    AuditLog::create($user->sub, 'DELETE', 'user', "Excluiu o colaborador {$name}", $id);

    Response::json(['success' => true]);
});

// POST /users/teachers/:id/reset-password
Router::post('/users/teachers/:id/reset-password', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR');

    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $password = $body['password'] ?? '';
    if (strlen($password) < 6) {
        Response::error('Senha deve ter no mínimo 6 caracteres', 400);
    }

    $existing = $db->selectCollection('users')->findOne(['id' => $id]);
    $name = $existing ? ((array)$existing)['name'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('users')->updateOne(['id' => $id], ['$set' => [
        'password'   => Auth::hashPassword($password),
        'updated_at' => date('c'),
    ]]);

    AuditLog::create($user->sub, 'RESET_PASSWORD', 'user', "Redefiniu a senha do colaborador {$name}", $id);

    Response::json(['success' => true]);
});

// PUT /users/profile
Router::put('/users/profile', function () {
    $user = Auth::requireAuth();
    $body = Auth::getBody();
    $db = Database::getDb();

    $update = ['updated_at' => date('c')];
    if (isset($body['name'])) $update['name'] = $body['name'];
    if (isset($body['email'])) $update['email'] = $body['email'];

    $db->selectCollection('users')->updateOne(['id' => $user->sub], ['$set' => $update]);

    $updated = (array)$db->selectCollection('users')->findOne(['id' => $user->sub]);
    $role = $updated['role'] ?? 'TEACHER';

    Response::json([
        'user' => [
            'id'          => $updated['id'] ?? $user->sub,
            'name'        => $updated['name'] ?? '',
            'email'       => $updated['email'] ?? '',
            'role'        => $role,
            'permissions' => Auth::ROLE_PERMISSIONS[$role] ?? [],
        ],
    ]);
});

// POST /users/change-password
Router::post('/users/change-password', function () {
    $user = Auth::requireAuth();
    $body = Auth::getBody();
    $db = Database::getDb();

    $currentPassword = $body['currentPassword'] ?? '';
    $newPassword = $body['newPassword'] ?? '';

    if (strlen($newPassword) < 6) {
        Response::error('Nova senha deve ter no mínimo 6 caracteres', 400);
    }

    $userDoc = (array)$db->selectCollection('users')->findOne(['id' => $user->sub]);
    if (!$userDoc) {
        Response::error('User not found', 404);
    }

    if (!Auth::verifyPassword($currentPassword, $userDoc['password'] ?? '')) {
        Response::error('Senha atual incorreta', 400);
    }

    $db->selectCollection('users')->updateOne(['id' => $user->sub], ['$set' => [
        'password'   => Auth::hashPassword($newPassword),
        'updated_at' => date('c'),
    ]]);

    Response::json(['success' => true]);
});
