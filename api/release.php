<?php
/**
 * Stock Issuance — deduct 1 unit, log RELEASED with yield + issuer + printer assigned.
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
require_once __DIR__ . '/../config/mailer.php';
auth_require_api();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$in = json_input();
$ref = normalize_ref($in['referenceNumber'] ?? $in['ref'] ?? '');
$inkCode = strtoupper(trim((string)($in['inkCode'] ?? $in['itemCode'] ?? $in['item_code'] ?? '')));
$dept = strtoupper(trim((string)($in['department'] ?? '')));
$location = trim((string)($in['location'] ?? ''));
$locationPrinter = trim((string)($in['locationPrinter'] ?? $in['printerName'] ?? ''));
$yield = isset($in['actualYield']) ? (int)$in['actualYield'] : (isset($in['yield']) ? (int)$in['yield'] : null);
$issuedBy = trim((string)($in['issuedBy'] ?? ''));
$recordedBy = auth_user();
$date = date('Y-m-d');

if ($ref === '') fail('Issuance reference is required.');
if ($inkCode === '') fail('Item code is required. Select an item from the list.');
if ($dept === '') fail('Department is required.');
if ($location === '') fail('Location is required.');
if ($issuedBy === '') $issuedBy = $recordedBy;

$pdo = db();

/** Optional column helper */
function txn_has_column(PDO $pdo, string $col): bool {
    static $cache = [];
    if (array_key_exists($col, $cache)) return $cache[$col];
    try {
        $s = $pdo->prepare(
            "SELECT 1 AS x FROM sys.columns WHERE object_id = OBJECT_ID('dbo.toner_transactions') AND name = ?"
        );
        $s->execute([$col]);
        $cache[$col] = (bool)$s->fetch();
    } catch (Throwable $e) {
        $cache[$col] = false;
    }
    return $cache[$col];
}

try {
    $pdo->beginTransaction();

    $dup = $pdo->prepare('SELECT id FROM dbo.toner_transactions WHERE reference_number = ?');
    $dup->execute([$ref]);
    if ($dup->fetch()) {
        $pdo->rollBack();
        fail('This reference was already recorded.', 409, [
            'duplicate' => true,
            'referenceNumber' => $ref,
        ]);
    }

    $inv = $pdo->prepare(
        'SELECT * FROM dbo.toner_inventory WITH (UPDLOCK, ROWLOCK) WHERE item_code = ?'
    );
    $inv->execute([$inkCode]);
    $row = $inv->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        $pdo->rollBack();
        fail("Item {$inkCode} not found in toner_inventory. Receive it via MRR or Add Toner first.");
    }
    $row = array_change_key_case($row, CASE_LOWER);
    $onHand = (int)($row['quantity'] ?? 0);
    if ($onHand < 1) {
        $pdo->rollBack();
        fail("Insufficient stock for {$inkCode} (0 on hand).");
    }

    $newQty = $onHand - 1;
    $upd = $pdo->prepare(
        'UPDATE dbo.toner_inventory SET quantity = ?, updated_at = SYSUTCDATETIME() WHERE id = ?'
    );
    $upd->execute([$newQty, (int)$row['id']]);

    $txnCode = new_txn_code($pdo);

    // Build insert dynamically for optional columns
    $cols = ['txn_code', 'type', 'reference_number', 'ink_code', 'quantity', 'txn_date', 'department', 'location', 'purpose', 'status', 'created_at'];
    $vals = ['?', "'RELEASED'", '?', '?', '1', '?', '?', '?', '?', "'RECORDED'", 'SYSUTCDATETIME()'];
    $params = [$txnCode, $ref, $inkCode, $date, $dept, $location, 'Stock issuance'];

    if (txn_has_column($pdo, 'actual_yield')) {
        $cols[] = 'actual_yield';
        $vals[] = '?';
        $params[] = $yield;
    }
    if (txn_has_column($pdo, 'issued_by')) {
        $cols[] = 'issued_by';
        $vals[] = '?';
        $params[] = $issuedBy;
    }
    if (txn_has_column($pdo, 'recorded_by')) {
        $cols[] = 'recorded_by';
        $vals[] = '?';
        $params[] = $recordedBy;
    }
    if (txn_has_column($pdo, 'location_printer')) {
        $cols[] = 'location_printer';
        $vals[] = '?';
        $params[] = $locationPrinter !== '' ? $locationPrinter : null;
    }

    $sql = 'INSERT INTO dbo.toner_transactions (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $vals) . ')';
    $pdo->prepare($sql)->execute($params);

    $pdo->commit();

    // If this toner is still low/out after issuance, email admins (reminder on issue)
    $mailResult = null;
    try {
        $reorder = (int)($row['reorder_level'] ?? 3);
        if ($newQty <= $reorder) {
            // Always email immediately when this issuance leaves the item low/out (bypass cooldown)
            $mailResult = notify_low_stock($pdo, [
                'force' => true,
                'force_items' => [$inkCode],
            ]);
        }
    } catch (Throwable $e) {
        $mailResult = ['sent' => false, 'error' => $e->getMessage()];
    }

    activity_log('issue_toner', 'Issued toner', [
        'reference' => $ref,
        'itemCode' => $inkCode,
        'details' => 'Issued 1 × ' . $inkCode . ' to ' . $dept . ' / ' . $location . ($issuedBy ? ' (by ' . $issuedBy . ')' : ''),
    ]);

    ok([
        'message' => 'Issuance recorded',
        'referenceNumber' => $ref,
        'inkCode' => $inkCode,
        'itemCode' => $inkCode,
        'quantity' => 1,
        'lowStockAlert' => $mailResult,
        'newStock' => $newQty,
        'department' => $dept,
        'location' => $location,
        'locationPrinter' => $locationPrinter,
        'actualYield' => $yield,
        'issuedBy' => $issuedBy,
        'recordedBy' => $recordedBy,
        'txnCode' => $txnCode,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail('Server error: ' . $e->getMessage(), 500);
}
