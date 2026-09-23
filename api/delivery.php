<?php
/**
 * Record delivery from MRR (preferred), multi-line, or manual single line.
 *
 * POST JSON:
 *  A) Preview (no write):
 *     { "action": "preview", "mrr": "MG009105" }
 *     → looks up ERP lines and returns them without posting
 *  B) MRR mode (post from ERP):
 *     { "mrr": "MG009105", "supplier": optional }
 *  C) Lines mode:
 *     { "referenceNumber": "MG009105", "lines": [ { itemCode, quantity, date, description }, ... ], "supplier": optional }
 *  D) Legacy single:
 *     { referenceNumber, inkCode, quantity, date, supplier }
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
require_once __DIR__ . '/../config/mailer.php';
auth_require_api();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$in = json_input();
$pdo = db();

/**
 * Detect optional inventory columns (last_mrr_no, description, ...)
 */
function inv_has_column(PDO $pdo, string $col): bool {
    static $cache = [];
    if (array_key_exists($col, $cache)) return $cache[$col];
    try {
        $stmt = $pdo->prepare(
            "SELECT 1 AS x FROM sys.columns WHERE object_id = OBJECT_ID('dbo.toner_inventory') AND name = ?"
        );
        $stmt->execute([$col]);
        $cache[$col] = (bool)$stmt->fetch();
    } catch (Throwable $e) {
        $cache[$col] = false;
    }
    return $cache[$col];
}

function fetch_mrr_lines(PDO $pdo, string $mrr): array {
    $sql = "
SELECT
  gmt.ExternalNumber AS MRR_no,
  gmt.aantal AS MRR_Qty,
  CASE WHEN gmt.oorsprong = 'R' THEN gmt.datum END AS MRR_Date,
  gmt.artcode AS Item_code,
  i.Description_0 AS Item_Desc
FROM [VM-EGNSERVER].[100].[DBO].[gbkmut] gmt WITH (NOLOCK)
INNER JOIN [VM-EGNSERVER].[100].[DBO].[Items] i WITH (NOLOCK)
  ON i.ItemCode = gmt.artcode
 AND (gmt.reknr = i.GLAccountDistribution OR gmt.reknr = i.GLAccountAsset)
WHERE transtype IN ('X', 'N', 'C', 'P')
  AND gmt.oorsprong = 'R'
  AND gmt.transsubtype IN ('A')
  AND gmt.bkstnr_sub IS NOT NULL
  AND i.Condition IN ('A')
  AND i.Type <> 'P'
  AND gmt.ExternalNumber = ?
";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mrr]);
    $out = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $r = array_change_key_case($r, CASE_LOWER);
        $code = strtoupper(trim((string)($r['item_code'] ?? '')));
        $qty = (int)round((float)($r['mrr_qty'] ?? 0));
        if ($code === '' || $qty < 1) continue;
        $dateRaw = $r['mrr_date'] ?? null;
        $date = $dateRaw ? substr((string)$dateRaw, 0, 10) : date('Y-m-d');
        $out[] = [
            'itemCode' => $code,
            'quantity' => $qty,
            'date' => $date,
            'description' => trim((string)($r['item_desc'] ?? '')),
        ];
    }
    return $out;
}

function post_delivery_line(PDO $pdo, string $ref, array $line, string $supplier): array {
    $inkCode = strtoupper(trim($line['itemCode'] ?? $line['inkCode'] ?? ''));
    $qty = (int)($line['quantity'] ?? 0);
    $date = trim((string)($line['date'] ?? date('Y-m-d')));
    $desc = trim((string)($line['description'] ?? ''));
    if ($inkCode === '') throw new RuntimeException('Item code missing on a delivery line.');
    if ($qty < 1) throw new RuntimeException("Invalid quantity for {$inkCode}.");
    if ($date === '') $date = date('Y-m-d');

    $inv = $pdo->prepare('SELECT * FROM dbo.toner_inventory WITH (UPDLOCK, ROWLOCK) WHERE item_code = ?');
    $inv->execute([$inkCode]);
    $row = $inv->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $insInv = $pdo->prepare(
            'INSERT INTO dbo.toner_inventory (item_code, description, printer_model, quantity, reorder_level, supplier, created_at, updated_at)
             VALUES (?, ?, ?, 0, 3, ?, SYSUTCDATETIME(), SYSUTCDATETIME())'
        );
        $insInv->execute([$inkCode, $desc !== '' ? $desc : null, '', $supplier !== '' ? $supplier : null]);
        $inv->execute([$inkCode]);
        $row = $inv->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException("Could not create inventory row for {$inkCode}.");
        }
    }
    $row = array_change_key_case($row, CASE_LOWER);
    $newQty = (int)$row['quantity'] + $qty;

    $sets = ['quantity = ?', 'updated_at = SYSUTCDATETIME()'];
    $params = [$newQty];
    if (inv_has_column($pdo, 'last_mrr_no')) {
        $sets[] = 'last_mrr_no = ?';
        $params[] = $ref;
    }
    if (inv_has_column($pdo, 'last_received_qty')) {
        $sets[] = 'last_received_qty = ?';
        $params[] = $qty;
    }
    if (inv_has_column($pdo, 'last_received_date')) {
        $sets[] = 'last_received_date = ?';
        $params[] = $date;
    }
    if ($desc !== '' && inv_has_column($pdo, 'description')) {
        $sets[] = 'description = ?';
        $params[] = $desc;
    }
    $params[] = $row['id'];
    $sql = 'UPDATE dbo.toner_inventory SET ' . implode(', ', $sets) . ' WHERE id = ?';
    $pdo->prepare($sql)->execute($params);

    $txnCode = new_txn_code($pdo);
    $ins = $pdo->prepare(
        "INSERT INTO dbo.toner_transactions
         (txn_code, type, reference_number, ink_code, quantity, txn_date, supplier, purpose, status, created_at)
         VALUES (?, 'RECEIVED', ?, ?, ?, ?, ?, ?, 'RECORDED', SYSUTCDATETIME())"
    );
    $ins->execute([
        $txnCode,
        $ref,
        $inkCode,
        $qty,
        $date,
        $supplier !== '' ? $supplier : null,
        'Stock delivery' . ($desc !== '' ? " — {$desc}" : ''),
    ]);

    return [
        'inkCode' => $inkCode,
        'quantity' => $qty,
        'newStock' => $newQty,
        'txnCode' => $txnCode,
        'description' => $desc,
    ];
}

try {
    $action = strtolower(trim((string)($in['action'] ?? 'record')));
    $mrr = strtoupper(trim((string)(
        $in['mrr'] ?? $in['mrrNo'] ?? $in['MRR'] ?? $in['referenceNumber'] ?? $in['ref'] ?? ''
    )));
    $ref = normalize_ref($mrr);
    $supplier = trim((string)($in['supplier'] ?? ''));
    $inkCodeExplicit = strtoupper(trim((string)($in['inkCode'] ?? $in['itemCode'] ?? '')));
    $hasLines = !empty($in['lines']) && is_array($in['lines']);

    if ($action === 'preview' || $action === 'search' || $action === 'lookup') {
        if ($ref === '') fail('MRR / reference number is required to search.');
        try {
            $lines = fetch_mrr_lines($pdo, $ref);
        } catch (Throwable $e) {
            fail('ERP lookup failed: ' . $e->getMessage() . ' Use Manual mode if the linked server is unavailable.', 502);
        }
        if (!$lines) {
            fail("MRR {$ref} not found in ERP (or no valid lines).", 404);
        }
        $dup = $pdo->prepare('SELECT id FROM dbo.toner_transactions WHERE reference_number = ?');
        $dup->execute([$ref]);
        $already = (bool)$dup->fetch();
        ok([
            'message' => 'MRR lines found',
            'referenceNumber' => $ref,
            'mrr' => $ref,
            'lineCount' => count($lines),
            'lines' => $lines,
            'alreadyRecorded' => $already,
        ]);
    }

    $lines = [];

    if ($hasLines) {
        if ($ref === '') {
            fail('Reference / MRR number is required.');
        }
        foreach ($in['lines'] as $L) {
            $code = strtoupper(trim((string)($L['itemCode'] ?? $L['inkCode'] ?? '')));
            $qty = (int)($L['quantity'] ?? 0);
            if ($code === '' || $qty < 1) continue;
            $lines[] = [
                'itemCode' => $code,
                'quantity' => $qty,
                'date' => trim((string)($L['date'] ?? date('Y-m-d'))) ?: date('Y-m-d'),
                'description' => trim((string)($L['description'] ?? '')),
            ];
        }
        if (!$lines) {
            fail('No valid lines in the delivery payload.');
        }
    }
    elseif ($inkCodeExplicit !== '') {
        if ($ref === '') fail('Reference / MRR number is required.');
        $qty = (int)($in['quantity'] ?? 0);
        $date = trim((string)($in['date'] ?? date('Y-m-d')));
        if ($qty < 1) fail('Quantity must be at least 1.');
        $lines[] = [
            'itemCode' => $inkCodeExplicit,
            'quantity' => $qty,
            'date' => $date ?: date('Y-m-d'),
            'description' => trim((string)($in['description'] ?? '')),
        ];
    }
    elseif ($ref !== '') {
        try {
            $lines = fetch_mrr_lines($pdo, $ref);
        } catch (Throwable $e) {
            fail('ERP lookup failed: ' . $e->getMessage() . ' Use Manual mode or send lines.', 502);
        }
        if (!$lines) {
            fail("MRR {$ref} not found in ERP (or no valid lines).", 404);
        }
    } else {
        fail('Provide a reference number with either MRR search, lines, or a toner code + quantity.');
    }

    if ($ref === '') fail('Reference / MRR number is required.');

    $pdo->beginTransaction();

    $dup = $pdo->prepare('SELECT id FROM dbo.toner_transactions WHERE reference_number = ?');
    $dup->execute([$ref]);
    if ($dup->fetch()) {
        $pdo->rollBack();
        fail('This MRR / reference was already recorded.', 409, [
            'duplicate' => true,
            'referenceNumber' => $ref,
        ]);
    }

    $posted = [];
    foreach ($lines as $line) {
        $posted[] = post_delivery_line($pdo, $ref, $line, $supplier);
    }

    $pdo->commit();

    activity_log('receive_delivery', 'Received delivery', [
        'reference' => $ref,
        'details' => 'Posted ' . count($posted) . ' line(s) from delivery/MRR',
    ]);

    try { notify_low_stock($pdo); } catch (Throwable $e) { /* ignore */ }

    ok([
        'message' => 'Delivery recorded' . (count($posted) > 1 ? ' (' . count($posted) . ' lines)' : ''),
        'referenceNumber' => $ref,
        'mrr' => $ref,
        'lineCount' => count($posted),
        'lines' => $posted,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail('Server error: ' . $e->getMessage(), 500);
}
