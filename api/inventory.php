<?php
/**
 * Inventory CRUD against dbo.toner_inventory
 * Columns: item_code, description, printer_model, quantity, reorder_level, supplier,
 *          last_mrr_no, last_received_qty, last_received_date, created_at, updated_at
 *
 * JSON still uses inkCode for the frontend (maps to item_code).
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
require_once __DIR__ . '/../config/mailer.php';
auth_require_api();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = db();

try {
    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, item_code, description, printer_model, quantity, reorder_level, supplier,
                    last_mrr_no, last_received_qty, last_received_date, created_at, updated_at
             FROM dbo.toner_inventory
             ORDER BY item_code ASC'
        );
        $items = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $items[] = map_inventory_row($r);
        }
        ok([
            'items' => $items,
            'database' => 'toner_inventory',
            'count' => count($items),
        ]);
    }

    if ($method === 'POST') {
        $in = json_input();
        $code = strtoupper(trim($in['inkCode'] ?? $in['itemCode'] ?? ''));
        $printer = trim($in['printerModel'] ?? '');
        $supplier = trim($in['supplier'] ?? '');
        $qty = max(0, (int)($in['quantity'] ?? 0));
        $reorder = max(0, (int)($in['reorderLevel'] ?? 3));
        $description = trim($in['description'] ?? '');

        if ($code === '') fail('Toner / item code is required.');
        if ($description === '') fail('Description is required (MRR Item_Desc).');
        // printer / supplier optional — MRR-style add only needs item_code, description, qty

        $check = $pdo->prepare('SELECT id FROM dbo.toner_inventory WHERE item_code = ?');
        $check->execute([$code]);
        if ($check->fetch()) fail("Item {$code} already exists.", 409);

        $stmt = $pdo->prepare(
            'INSERT INTO dbo.toner_inventory
                (item_code, description, printer_model, quantity, reorder_level, supplier, created_at, updated_at)
             OUTPUT INSERTED.*
             VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME())'
        );
        $stmt->execute([
            $code,
            $description !== '' ? $description : null,
            $printer !== '' ? $printer : null,
            $qty,
            $reorder > 0 ? $reorder : 3,
            $supplier !== '' ? $supplier : null,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $rowStmt = $pdo->prepare('SELECT * FROM dbo.toner_inventory WHERE item_code = ?');
            $rowStmt->execute([$code]);
            $row = $rowStmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$row) {
            fail('Insert ran but row not found. Check table dbo.toner_inventory uses column item_code.', 500);
        }

        activity_log('add_toner', 'Added toner to inventory', [
            'itemCode' => $code,
            'details' => 'Qty ' . $qty . ($description !== '' ? ' · ' . $description : ''),
        ]);
        ok([
            'item' => map_inventory_row($row),
            'database' => 'toner_inventory',
            'message' => 'Saved to dbo.toner_inventory (item_code)',
        ], 201);
    }

    if ($method === 'PUT') {
        $in = json_input();
        $code = strtoupper(trim($in['inkCode'] ?? $in['itemCode'] ?? ''));
        if ($code === '') fail('Toner / item code is required.');

        $stmt = $pdo->prepare('SELECT * FROM dbo.toner_inventory WHERE item_code = ?');
        $stmt->execute([$code]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) fail('Item not found.', 404);
        $row = array_change_key_case($row, CASE_LOWER);

        $printer = array_key_exists('printerModel', $in) ? trim((string)$in['printerModel']) : (string)($row['printer_model'] ?? '');
        $supplier = array_key_exists('supplier', $in) ? trim((string)$in['supplier']) : (string)($row['supplier'] ?? '');
        $qty = array_key_exists('quantity', $in) ? max(0, (int)$in['quantity']) : (int)$row['quantity'];
        $reorder = array_key_exists('reorderLevel', $in) ? max(0, (int)$in['reorderLevel']) : (int)$row['reorder_level'];
        $description = array_key_exists('description', $in) ? trim((string)$in['description']) : (string)($row['description'] ?? '');

        // printer optional on edit

        $oldQty = (int)$row['quantity'];
        $upd = $pdo->prepare(
            'UPDATE dbo.toner_inventory
             SET description = ?, printer_model = ?, supplier = ?, quantity = ?, reorder_level = ?, updated_at = SYSUTCDATETIME()
             WHERE item_code = ?'
        );
        $upd->execute([
            $description !== '' ? $description : null,
            $printer,
            $supplier !== '' ? $supplier : null,
            $qty,
            $reorder,
            $code,
        ]);

        if ($qty !== $oldQty) {
            $diff = $qty - $oldQty;
            $txnCode = new_txn_code($pdo);
            $type = $diff > 0 ? 'RECEIVED' : 'RELEASED';
            $abs = abs($diff);
            $ref = 'ADJ-' . date('Ymd-His');
            $ins = $pdo->prepare(
                "INSERT INTO dbo.toner_transactions
                 (txn_code, type, reference_number, ink_code, quantity, txn_date, supplier, purpose, status, created_at)
                 VALUES (?, ?, ?, ?, ?, CAST(GETDATE() AS DATE), ?, ?, 'RECORDED', SYSUTCDATETIME())"
            );
            $purpose = $diff > 0 ? "Stock card adjustment (+{$abs})" : "Stock card adjustment (-{$abs})";
            $ins->execute([
                $txnCode,
                $type,
                $ref,
                $code,
                $abs,
                $diff > 0 ? ($supplier !== '' ? $supplier : null) : null,
                $purpose,
            ]);
        }

        $rowStmt = $pdo->prepare('SELECT * FROM dbo.toner_inventory WHERE item_code = ?');
        $rowStmt->execute([$code]);
        $fresh = $rowStmt->fetch(PDO::FETCH_ASSOC);
        activity_log('edit_inventory', 'Edited stock card', [
            'itemCode' => $code ?? '',
            'details' => 'Updated inventory details or quantity',
        ]);
        try { notify_low_stock($pdo); } catch (Throwable $e) { /* ignore mail */ }
        ok(['item' => map_inventory_row($fresh), 'message' => 'Stock card updated']);
    }

    if ($method === 'DELETE') {
        $in = json_input();
        $code = strtoupper(trim($in['inkCode'] ?? $in['itemCode'] ?? ($_GET['inkCode'] ?? '')));
        if ($code === '') fail('Toner / item code is required.');
        $stmt = $pdo->prepare('DELETE FROM dbo.toner_inventory WHERE item_code = ?');
        $stmt->execute([$code]);
        if ($stmt->rowCount() === 0) fail('Item not found in dbo.toner_inventory.', 404);
        activity_log('remove_toner', 'Removed toner from inventory', [
            'itemCode' => $code,
            'details' => 'Deleted item ' . $code,
        ]);
        ok(['deleted' => $code, 'database' => 'toner_inventory']);
    }

    fail('Method not allowed', 405);
} catch (Throwable $e) {
    fail('Server error: ' . $e->getMessage(), 500);
}

function map_inventory_row(array $r): array {
    $r = array_change_key_case($r, CASE_LOWER);
    // Support both item_code (current) and legacy ink_code
    $code = (string)($r['item_code'] ?? $r['ink_code'] ?? '');
    return [
        'id' => 'TNR-' . ($r['id'] ?? ''),
        'inkCode' => $code,
        'itemCode' => $code,
        'brand' => (string)($r['brand'] ?? ''),
        'printerModel' => (string)($r['printer_model'] ?? ''),
        'quantity' => (int)($r['quantity'] ?? 0),
        'reorderLevel' => (int)($r['reorder_level'] ?? 0),
        'supplier' => (string)($r['supplier'] ?? ''),
        'description' => (string)($r['description'] ?? ''),
        'lastMrrNo' => (string)($r['last_mrr_no'] ?? ''),
        'lastReceivedQty' => isset($r['last_received_qty']) ? (int)$r['last_received_qty'] : null,
        'lastReceivedDate' => isset($r['last_received_date']) ? substr((string)$r['last_received_date'], 0, 10) : '',
        'department' => '',
        'location' => '',
        'serialNumbers' => [],
        'createdAt' => (string)($r['created_at'] ?? ''),
        'updatedAt' => (string)($r['updated_at'] ?? ''),
    ];
}
