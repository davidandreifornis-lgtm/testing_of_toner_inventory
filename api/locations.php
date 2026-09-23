<?php
/**
 * CRUD for editable department / location / printer mappings.
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
auth_require_api();

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function ensure_locations_table(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    try {
        $pdo->query('SELECT TOP 1 id FROM dbo.toner_locations');
        $done = true;
    } catch (Throwable $e) {
        fail(
            'Table dbo.toner_locations is missing. Run sql/migration_issuance_fields.sql on database toner_inventory. Detail: ' . $e->getMessage(),
            500
        );
    }
}

function map_loc(array $r): array {
    $r = array_change_key_case($r, CASE_LOWER);
    return [
        'id' => (int)($r['id'] ?? 0),
        'department' => (string)($r['department'] ?? ''),
        'location' => (string)($r['location'] ?? ''),
        'printerName' => (string)($r['printer_name'] ?? ''),
        'isActive' => !empty($r['is_active']),
        'createdAt' => (string)($r['created_at'] ?? ''),
        'updatedAt' => (string)($r['updated_at'] ?? ''),
    ];
}

try {
    ensure_locations_table($pdo);

    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, department, location, printer_name, is_active, created_at, updated_at
             FROM dbo.toner_locations
             WHERE is_active = 1
             ORDER BY department, location'
        );
        $items = array_map('map_loc', $stmt->fetchAll(PDO::FETCH_ASSOC));
        ok(['locations' => $items, 'count' => count($items)]);
    }

    if ($method === 'POST') {
        $in = json_input();
        $dept = strtoupper(trim((string)($in['department'] ?? '')));
        $loc = trim((string)($in['location'] ?? ''));
        $printer = trim((string)($in['printerName'] ?? $in['printer_name'] ?? ''));
        if ($dept === '') fail('Department is required.');
        if ($loc === '') fail('Location is required.');

        $stmt = $pdo->prepare(
            'INSERT INTO dbo.toner_locations (department, location, printer_name, is_active, created_at, updated_at)
             OUTPUT INSERTED.*
             VALUES (?, ?, ?, 1, SYSUTCDATETIME(), SYSUTCDATETIME())'
        );
        try {
            $stmt->execute([$dept, $loc, $printer !== '' ? $printer : null]);
        } catch (Throwable $e) {
            fail('Could not add location (maybe duplicate department + location): ' . $e->getMessage(), 409);
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $q = $pdo->prepare('SELECT * FROM dbo.toner_locations WHERE department = ? AND location = ?');
            $q->execute([$dept, $loc]);
            $row = $q->fetch(PDO::FETCH_ASSOC);
        }
        activity_log('add_location', 'Added location', [
            'details' => $dept . ' / ' . $loc . ($printer !== '' ? ' — printer: ' . $printer : ''),
        ]);
        ok(['location' => map_loc($row), 'message' => 'Location added'], 201);
    }

    if ($method === 'PUT') {
        $in = json_input();
        $id = (int)($in['id'] ?? 0);
        if ($id < 1) fail('Location id is required.');
        $dept = strtoupper(trim((string)($in['department'] ?? '')));
        $loc = trim((string)($in['location'] ?? ''));
        $printer = trim((string)($in['printerName'] ?? $in['printer_name'] ?? ''));
        if ($dept === '') fail('Department is required.');
        if ($loc === '') fail('Location is required.');

        $upd = $pdo->prepare(
            'UPDATE dbo.toner_locations
             SET department = ?, location = ?, printer_name = ?, updated_at = SYSUTCDATETIME()
             WHERE id = ?'
        );
        $upd->execute([$dept, $loc, $printer !== '' ? $printer : null, $id]);
        if ($upd->rowCount() === 0) {
            // may be 0 if values unchanged — still fetch
        }
        $q = $pdo->prepare('SELECT * FROM dbo.toner_locations WHERE id = ?');
        $q->execute([$id]);
        $row = $q->fetch(PDO::FETCH_ASSOC);
        if (!$row) fail('Location not found.', 404);
        activity_log('edit_location', 'Edited location', [
            'details' => $dept . ' / ' . $loc . ($printer !== '' ? ' — printer: ' . $printer : ''),
        ]);
        ok(['location' => map_loc($row), 'message' => 'Location updated']);
    }

    if ($method === 'DELETE') {
        $in = json_input();
        $id = (int)($in['id'] ?? $_GET['id'] ?? 0);
        if ($id < 1) fail('Location id is required.');
        // Soft-delete
        $upd = $pdo->prepare(
            'UPDATE dbo.toner_locations SET is_active = 0, updated_at = SYSUTCDATETIME() WHERE id = ?'
        );
        $upd->execute([$id]);
        if ($upd->rowCount() === 0) fail('Location not found.', 404);
        activity_log('remove_location', 'Removed location', [
            'details' => 'Location id ' . $id,
        ]);
        ok(['deleted' => $id]);
    }

    fail('Method not allowed', 405);
} catch (Throwable $e) {
    fail('Server error: ' . $e->getMessage(), 500);
}
