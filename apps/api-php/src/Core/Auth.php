<?php
/**
 * Middleware de autenticação JWT e controle de cargos
 */

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth
{
    /**
     * Permissões padrão por cargo
     */
    public const ROLE_PERMISSIONS = [
        'ADMIN'       => ['alunos', 'turmas', 'presenca', 'plano_aula', 'calendario', 'comunicacao', 'notas'],
        'DIRECTOR'    => ['alunos', 'turmas', 'presenca', 'plano_aula', 'calendario', 'comunicacao', 'notas'],
        'COORDINATOR' => ['alunos', 'turmas', 'presenca', 'plano_aula', 'calendario', 'comunicacao'],
        'SECRETARY'   => ['alunos', 'turmas', 'presenca', 'calendario'],
        'TEACHER'     => ['turmas', 'presenca', 'plano_aula', 'notas'],
        'STUDENT'     => [],
    ];

    /**
     * Gera um token JWT
     */
    public static function signToken(array $payload): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'projeto-anjos-secret-key-2026';
        $payload['iat'] = time();
        $payload['exp'] = time() + (7 * 24 * 60 * 60); // 7 dias
        return JWT::encode($payload, $secret, 'HS256');
    }

    /**
     * Decodifica e valida um token JWT
     */
    public static function decodeToken(string $token): ?object
    {
        try {
            $secret = $_ENV['JWT_SECRET'] ?? 'projeto-anjos-secret-key-2026';
            return JWT::decode($token, new Key($secret, 'HS256'));
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Exige autenticação. Retorna os dados do usuário decodificados do JWT.
     * Encerra a requisição com 401 se não autenticado.
     */
    public static function requireAuth(): object
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $header);

        if (empty($token)) {
            Response::error('Token não fornecido', 401);
        }

        $decoded = self::decodeToken($token);
        if ($decoded === null) {
            Response::error('Token inválido ou expirado', 401);
        }

        return $decoded;
    }

    /**
     * Exige que o usuário tenha um dos cargos listados.
     * Encerra a requisição com 403 se não autorizado.
     */
    public static function requireRole(object $user, string ...$roles): void
    {
        $userRole = $user->role ?? '';
        // ADMIN tem acesso total
        if ($userRole === 'ADMIN') {
            return;
        }
        if (!in_array($userRole, $roles, true)) {
            Response::error('Acesso negado: permissão insuficiente', 403);
        }
    }

    /**
     * Lê o corpo JSON da requisição
     */
    public static function getBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? [];
    }

    /**
     * Retorna query parameters da requisição
     */
    public static function getQuery(): array
    {
        return $_GET;
    }

    /**
     * Hash de senha com bcrypt
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    /**
     * Verifica senha contra o hash bcrypt
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
}
