<?php
/**
 * Rotas de Planos de Aula
 * GET    /lessons     - Listar planos
 * POST   /lessons     - Criar plano de aula
 * PUT    /lessons/:id - Atualizar plano
 * DELETE /lessons/:id - Excluir plano
 */

use App\Core\Router;
use App\Core\Response;
use App\Core\Database;
use App\Core\Auth;
use App\Core\AuditLog;

Router::get('/lessons', function () {
    $user = Auth::requireAuth();
    $db = Database::getDb();

    $filter = [];
    if (($user->role ?? '') === 'TEACHER') {
        $teacherClasses = $db->selectCollection('classes')->find(['professor_id' => $user->sub]);
        $classIds = [];
        foreach ($teacherClasses as $c) {
            $classIds[] = ((array)$c)['id'] ?? (string)(((array)$c)['_id'] ?? '');
        }
        $filter = ['class_id' => ['$in' => $classIds]];
    }

    $docs = $db->selectCollection('lessons')->find($filter, ['sort' => ['created_at' => -1]]);
    $lessons = [];
    foreach ($docs as $l) {
        $l = (array)$l;
        $lessons[] = [
            'id'          => $l['id'] ?? (string)($l['_id'] ?? ''),
            'data'        => $l['data'] ?? '',
            'endDate'     => $l['end_date'] ?? $l['endDate'] ?? '',
            'turma'       => $l['turma'] ?? '',
            'classId'     => $l['class_id'] ?? $l['classId'] ?? '',
            'disciplina'  => $l['disciplina'] ?? '',
            'conteudo'    => $l['conteudo'] ?? '',
            'observacoes' => $l['observacoes'] ?? '',
            'files'       => $l['files'] ?? [],
            'createdAt'   => $l['created_at'] ?? '',
        ];
    }

    Response::json(['lessons' => $lessons]);
});

Router::post('/lessons', function () {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'TEACHER');
    $body = Auth::getBody();
    $db = Database::getDb();
    $id = Database::uuid();

    $row = [
        'id'          => $id,
        'data'        => $body['data'] ?? '',
        'end_date'    => $body['endDate'] ?? '',
        'turma'       => $body['turma'] ?? '',
        'class_id'    => $body['classId'] ?? '',
        'disciplina'  => $body['disciplina'] ?? '',
        'conteudo'    => $body['conteudo'] ?? '',
        'observacoes' => $body['observacoes'] ?? '',
        'files'       => $body['files'] ?? [],
        'created_at'  => date('c'),
    ];

    $db->selectCollection('lessons')->insertOne($row);
    AuditLog::create($user->sub, 'CREATE', 'lesson', "Criou plano de aula para a turma {$row['turma']}", $id);

    Response::json(['lesson' => array_merge($body, ['id' => $id, 'createdAt' => $row['created_at']])], 201);
});

Router::put('/lessons/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'TEACHER');
    $id = $params[0];
    $body = Auth::getBody();
    $db = Database::getDb();

    $update = [];
    if (isset($body['data'])) $update['data'] = $body['data'];
    if (isset($body['endDate'])) $update['end_date'] = $body['endDate'];
    if (isset($body['turma'])) $update['turma'] = $body['turma'];
    if (isset($body['classId'])) $update['class_id'] = $body['classId'];
    if (isset($body['disciplina'])) $update['disciplina'] = $body['disciplina'];
    if (isset($body['conteudo'])) $update['conteudo'] = $body['conteudo'];
    if (isset($body['observacoes'])) $update['observacoes'] = $body['observacoes'];
    if (isset($body['files'])) $update['files'] = $body['files'];

    $db->selectCollection('lessons')->updateOne(['id' => $id], ['$set' => $update]);

    $doc = $db->selectCollection('lessons')->findOne(['id' => $id]);
    $name = $doc ? ((array)$doc)['turma'] ?? 'Desconhecido' : 'Desconhecido';
    AuditLog::create($user->sub, 'UPDATE', 'lesson', "Atualizou plano de aula da turma {$name}", $id);

    Response::json(['success' => true]);
});

Router::delete('/lessons/:id', function (array $params) {
    $user = Auth::requireAuth();
    Auth::requireRole($user, 'DIRECTOR', 'COORDINATOR', 'TEACHER');
    $id = $params[0];
    $db = Database::getDb();

    $doc = $db->selectCollection('lessons')->findOne(['id' => $id]);
    $name = $doc ? ((array)$doc)['turma'] ?? 'Desconhecido' : 'Desconhecido';

    $db->selectCollection('lessons')->deleteOne(['id' => $id]);
    AuditLog::create($user->sub, 'DELETE', 'lesson', "Excluiu plano de aula da turma {$name}", $id);

    Response::json(['success' => true]);
});
