<?php
/**
 * Router simples para API REST
 */

namespace App\Core;

class Router
{
    /** @var array<string, array<string, callable>> */
    private static array $routes = [];

    public static function get(string $path, callable $handler): void
    {
        self::$routes['GET'][$path] = $handler;
    }

    public static function post(string $path, callable $handler): void
    {
        self::$routes['POST'][$path] = $handler;
    }

    public static function put(string $path, callable $handler): void
    {
        self::$routes['PUT'][$path] = $handler;
    }

    public static function delete(string $path, callable $handler): void
    {
        self::$routes['DELETE'][$path] = $handler;
    }

    /**
     * Despacha a requisição para o handler correto
     */
    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        // Tentar correspondência exata
        if (isset(self::$routes[$method][$uri])) {
            $handler = self::$routes[$method][$uri];
            $handler([]);
            return;
        }

        // Tentar correspondência com parâmetros (:id)
        foreach (self::$routes[$method] ?? [] as $pattern => $handler) {
            $regex = preg_replace('/:[a-zA-Z]+/', '([^/]+)', $pattern);
            $regex = '#^' . $regex . '$#';

            if (preg_match($regex, $uri, $matches)) {
                array_shift($matches);
                $handler($matches);
                return;
            }
        }

        Response::json(['error' => 'Endpoint não encontrado'], 404);
    }
}
