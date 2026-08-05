<?php
/** Health check */

use App\Core\Router;
use App\Core\Response;

Router::get('/health', function () {
    Response::json(['ok' => true]);
});
