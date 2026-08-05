<?php
/**
 * Classe de conexão com MongoDB Atlas
 */

namespace App\Core;

use MongoDB\Client;
use MongoDB\Database as MongoDatabase;

class Database
{
    private static ?MongoDatabase $db = null;

    public static function init(): void
    {
        if (self::$db !== null) {
            return;
        }

        $uri = $_ENV['DATABASE_URL']
            ?? 'mongodb://engsguilhermevieira_db_user:GJiY1s6dANVYBb8z@ac-jmnedzg-shard-00-00.bstpphz.mongodb.net:27017,ac-jmnedzg-shard-00-01.bstpphz.mongodb.net:27017,ac-jmnedzg-shard-00-02.bstpphz.mongodb.net:27017/projeto_anjos?ssl=true&authSource=admin&appName=Cluster0';

        $client = new Client($uri);
        self::$db = $client->selectDatabase('projeto_anjos');
    }

    public static function getDb(): MongoDatabase
    {
        if (self::$db === null) {
            self::init();
        }
        return self::$db;
    }

    /**
     * Gera um UUID v4
     */
    public static function uuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Normaliza um documento MongoDB para o formato padrão da API
     */
    public static function normalize(array|object|null $doc): ?array
    {
        if ($doc === null) {
            return null;
        }

        $doc = (array)$doc;
        $id = $doc['id'] ?? (isset($doc['_id']) ? (string)$doc['_id'] : self::uuid());

        return array_merge($doc, [
            'id' => $id,
            'dataNascimento' => $doc['dataNascimento'] ?? $doc['data_nascimento'] ?? '',
            'data_nascimento' => $doc['data_nascimento'] ?? $doc['dataNascimento'] ?? '',
            'classId' => $doc['classId'] ?? $doc['class_id'] ?? null,
            'class_id' => $doc['class_id'] ?? $doc['classId'] ?? null,
            'classIds' => $doc['classIds'] ?? $doc['class_ids'] ?? [],
            'class_ids' => $doc['class_ids'] ?? $doc['classIds'] ?? [],
            'courseId' => $doc['courseId'] ?? $doc['course_id'] ?? null,
            'course_id' => $doc['course_id'] ?? $doc['courseId'] ?? null,
            'professorId' => $doc['professorId'] ?? $doc['professor_id'] ?? null,
            'professor_id' => $doc['professor_id'] ?? $doc['professorId'] ?? null,
            'studentId' => $doc['studentId'] ?? $doc['student_id'] ?? $doc['alunoId'] ?? null,
            'student_id' => $doc['student_id'] ?? $doc['studentId'] ?? $doc['alunoId'] ?? null,
            'diasSemana' => $doc['diasSemana'] ?? $doc['dias_semana'] ?? [],
            'dias_semana' => $doc['dias_semana'] ?? $doc['diasSemana'] ?? [],
            'alunosMatriculados' => $doc['alunosMatriculados'] ?? $doc['alunos_matriculados'] ?? 0,
            'alunos_matriculados' => $doc['alunos_matriculados'] ?? $doc['alunosMatriculados'] ?? 0,
            'studentIds' => $doc['studentIds'] ?? $doc['student_ids'] ?? [],
            'student_ids' => $doc['student_ids'] ?? $doc['studentIds'] ?? [],
            'createdAt' => $doc['createdAt'] ?? $doc['created_at'] ?? date('c'),
            'created_at' => $doc['created_at'] ?? $doc['createdAt'] ?? date('c'),
        ]);
    }
}
