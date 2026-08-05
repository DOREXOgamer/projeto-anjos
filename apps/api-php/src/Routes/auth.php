<?php
/**
 * Rotas de Autenticação
 * POST /auth/register  - Cadastro de usuário
 * POST /auth/login     - Login com email e senha
 * GET  /auth/me        - Perfil do usuário autenticado
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;

// POST /auth/register
Router::post('/auth/register', function () {
    $body = Auth::getBody();
    $db = Database::getDb();

    $name     = trim($body['name'] ?? '');
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $role     = $body['role'] ?? 'TEACHER';

    if (empty($name) || empty($email) || strlen($password) < 6) {
        Response::error('Nome, email e senha (min 6 caracteres) são obrigatórios', 400);
    }

    $existing = $db->selectCollection('users')->findOne(['email' => $email]);
    if ($existing) {
        Response::error('Email already in use', 409);
    }

    if ($role === 'DIRECTOR') {
        $count = $db->selectCollection('users')->countDocuments();
        if ($count > 0) {
            Response::error('Director role can only be assigned to the first user', 403);
        }
    }

    $id = Database::uuid();
    $passwordHash = Auth::hashPassword($password);
    $permissions = Auth::ROLE_PERMISSIONS[$role] ?? [];

    $row = [
        'id'          => $id,
        'name'        => $name,
        'email'       => $email,
        'password'    => $passwordHash,
        'role'        => $role,
        'permissions' => $permissions,
        'active'      => true,
        'created_at'  => date('c'),
    ];

    $db->selectCollection('users')->insertOne($row);

    $token = Auth::signToken(['sub' => $id, 'email' => $email, 'role' => $role]);

    Response::json([
        'token' => $token,
        'user'  => [
            'id'          => $id,
            'name'        => $name,
            'email'       => $email,
            'role'        => $role,
            'permissions' => $permissions,
            'active'      => true,
        ],
    ], 201);
});

// POST /auth/login
Router::post('/auth/login', function () {
    $body = Auth::getBody();
    $db = Database::getDb();

    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($email) || strlen($password) < 6) {
        Response::error('Email e senha são obrigatórios', 400);
    }

    $userDoc = $db->selectCollection('users')->findOne(['email' => $email]);

    if (!$userDoc) {
        Response::error('Invalid credentials', 401);
    }

    $userDoc = (array)$userDoc;

    if (($userDoc['active'] ?? true) === false) {
        Response::error('Sua conta está desativada. Entre em contato com a administração.', 403);
    }

    $storedHash = $userDoc['password'] ?? $userDoc['passwordHash'] ?? '';
    if (!Auth::verifyPassword($password, $storedHash)) {
        Response::error('Invalid credentials', 401);
    }

    $userId = $userDoc['id'] ?? (string)($userDoc['_id'] ?? '');
    $role = $userDoc['role'] ?? 'TEACHER';
    $permissions = Auth::ROLE_PERMISSIONS[$role] ?? [];
    $token = Auth::signToken(['sub' => $userId, 'email' => $email, 'role' => $role]);

    Response::json([
        'token' => $token,
        'user'  => [
            'id'          => $userId,
            'name'        => $userDoc['name'] ?? '',
            'email'       => $userDoc['email'] ?? '',
            'role'        => $role,
            'permissions' => $permissions,
            'active'      => ($userDoc['active'] ?? true) !== false,
        ],
    ]);
});

// GET /auth/me
Router::get('/auth/me', function () {
    $decoded = Auth::requireAuth();
    $db = Database::getDb();

    $userDoc = $db->selectCollection('users')->findOne(['id' => $decoded->sub]);
    if (!$userDoc) {
        // Tentar por _id do MongoDB
        try {
            $userDoc = $db->selectCollection('users')->findOne(['_id' => new MongoDB\BSON\ObjectId($decoded->sub)]);
        } catch (\Exception $e) {}
    }

    if (!$userDoc) {
        Response::error('User not found', 404);
    }

    $userDoc = (array)$userDoc;
    if (($userDoc['active'] ?? true) === false) {
        Response::error('Sua conta está desativada', 403);
    }

    $role = $userDoc['role'] ?? 'TEACHER';
    $permissions = Auth::ROLE_PERMISSIONS[$role] ?? [];

    Response::json([
        'user' => [
            'id'          => $userDoc['id'] ?? (string)($userDoc['_id'] ?? ''),
            'name'        => $userDoc['name'] ?? '',
            'email'       => $userDoc['email'] ?? '',
            'role'        => $role,
            'permissions' => $permissions,
            'active'      => true,
            'createdAt'   => $userDoc['created_at'] ?? '',
        ],
    ]);
});
