<?php
/** CRUD for supplier master list (stock card dropdown). */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
auth_require_api();

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function map_supplier(array $r): array {
    $r = array_change_key_case($r, CASE_LOWER);
    return [
        'id' => (int)($r['id'] ?? 0),
        'name' => (string)($r['name'] ?? ''),
        'isActive' => !empty($r['is_active']),
        'createdAt' => (string)($r['created_at'] ?? ''),
        'updatedAt' => (string)($r['updated_at'] ?? ''),
    ];
}

try {
    try {
        $pdo->query('SELECT TOP 1 id FROM dbo.toner_suppliers');
    } catch (Throwable $e) {
        fail('Table dbo.toner_suppliers missing. Run sql/migration_suppliers.sql. Detail: ' . $e->getMessage(), 500);
    }

    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, name, is_active, created_at, updated_at
             FROM dbo.toner_suppliers WHERE is_active = 1 ORDER BY name ASC'
        );
        $items = array_map('map_supplier', $stmt->fetchAll(PDO::FETCH_ASSOC));
        ok(['suppliers' => $items, 'count' => count($items)]);
    }

    if ($method === 'POST') {
        $in = json_input();
        $name = trim((string)($in['name'] ?? ''));
        if ($name === '') fail('Supplier name is required.');
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO dbo.toner_suppliers (name, is_active, created_at, updated_at)
                 OUTPUT INSERTED.*
                 VALUES (?, 1, SYSUTCDATETIME(), SYSUTCDATETIME())'
            );
            $stmt->execute([$name]);
        } catch (Throwable $e) {
            fail('Could not add supplier (duplicate?): ' . $e->getMessage(), 409);
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $q = $pdo->prepare('SELECT * FROM dbo.toner_suppliers WHERE name = ?');
            $q->execute([$name]);
            $row = $q->fetch(PDO::FETCH_ASSOC);
        }
        activity_log('add_supplier', 'Added supplier', ['details' => $name]);
        ok(['supplier' => map_supplier($row), 'message' => 'Supplier added'], 201);
    }

    if ($method === 'PUT') {
        $in = json_input();
        $id = (int)($in['id'] ?? 0);
        $name = trim((string)($in['name'] ?? ''));
        if ($id < 1) fail('Supplier id is required.');
        if ($name === '') fail('Supplier name is required.');
        $upd = $pdo->prepare(
            'UPDATE dbo.toner_suppliers SET name = ?, updated_at = SYSUTCDATETIME() WHERE id = ?'
        );
        $upd->execute([$name, $id]);
        $q = $pdo->prepare('SELECT * FROM dbo.toner_suppliers WHERE id = ?');
        $q->execute([$id]);
        $row = $q->fetch(PDO::FETCH_ASSOC);
        if (!$row) fail('Supplier not found.', 404);
        activity_log('edit_supplier', 'Edited supplier', ['details' => $name]);
        ok(['supplier' => map_supplier($row), 'message' => 'Supplier updated']);
    }

    if ($method === 'DELETE') {
        $in = json_input();
        $id = (int)($in['id'] ?? $_GET['id'] ?? 0);
        if ($id < 1) fail('Supplier id is required.');
        $upd = $pdo->prepare(
            'UPDATE dbo.toner_suppliers SET is_active = 0, updated_at = SYSUTCDATETIME() WHERE id = ?'
        );
        $upd->execute([$id]);
        if ($upd->rowCount() === 0) fail('Supplier not found.', 404);
        activity_log('remove_supplier', 'Removed supplier', ['details' => 'Supplier id ' . $id]);
        ok(['deleted' => $id]);
    }

    fail('Method not allowed', 405);
} catch (Throwable $e) {
    fail('Server error: ' . $e->getMessage(), 500);
}
