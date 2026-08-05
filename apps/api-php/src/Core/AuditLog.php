<?php
/**
 * Serviço de log de auditoria
 */

namespace App\Core;

class AuditLog
{
    /**
     * Registra uma ação no log de auditoria
     */
    public static function create(
        string $userId,
        string $action,
        string $resource,
        string $description,
        ?string $resourceId = null
    ): void {
        try {
            $db = Database::getDb();
            $db->selectCollection('audit_logs')->insertOne([
                'id'          => Database::uuid(),
                'user_id'     => $userId,
                'action'      => $action,
                'resource'    => $resource,
                'details'     => $description,
                'resource_id' => $resourceId,
                'timestamp'   => date('c'),
            ]);
        } catch (\Exception $e) {
            // Silencioso - falha no audit não deve quebrar a operação
            error_log("Audit log error: " . $e->getMessage());
        }
    }
}
