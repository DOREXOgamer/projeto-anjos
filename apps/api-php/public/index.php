<?php
/**
 * Projeto Anjos Inocentes - API PHP
 * Ponto de entrada principal (Front Controller)
 *
 * Todas as requisições HTTP são roteadas por este arquivo.
 * Utilize com o servidor embutido do PHP:
 *   php -S localhost:4000 -t public public/index.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Database;
use App\Core\Response;

// Carregar variáveis de ambiente
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

// Configurar CORS
$corsOrigin = $_ENV['CORS_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$corsOrigin}");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Inicializar banco de dados
Database::init();

// Roteamento
$router = new Router();

// Registrar rotas
require_once __DIR__ . '/../src/Routes/health.php';
require_once __DIR__ . '/../src/Routes/auth.php';
require_once __DIR__ . '/../src/Routes/students.php';
require_once __DIR__ . '/../src/Routes/classes.php';
require_once __DIR__ . '/../src/Routes/users.php';
require_once __DIR__ . '/../src/Routes/attendance.php';
require_once __DIR__ . '/../src/Routes/courses.php';
require_once __DIR__ . '/../src/Routes/lessons.php';
require_once __DIR__ . '/../src/Routes/events.php';
require_once __DIR__ . '/../src/Routes/announcements.php';
require_once __DIR__ . '/../src/Routes/grades.php';
require_once __DIR__ . '/../src/Routes/stats.php';
require_once __DIR__ . '/../src/Routes/audit.php';

// Disparar o roteador
$router->dispatch();
