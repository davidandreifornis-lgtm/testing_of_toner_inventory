<?php
/**
 * Defective workflow:
 *  POST { action: "flag", referenceNumber, notes }           — mark issuance defective (original)
 *  POST { action: "send_to_supplier", referenceNumber }      — ship defective unit to supplier
 *  POST { action: "receive_replacement", referenceNumber, acceptedBy }
 *       — supplier returned good unit; stock +1; record acceptedBy + recordedBy
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
require_once __DIR__ . '/../config/mailer.php';
auth_require_api();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

$in = json_input();
$action = strtolower(trim((string)($in['action'] ?? 'flag')));
$ref = normalize_ref($in['referenceNumber'] ?? $in['ref'] ?? '');
$notes = trim((string)($in['notes'] ?? ''));
$acceptedBy = trim((string)($in['acceptedBy'] ?? $in['issuedBy'] ?? ''));
$recordedBy = auth_user();

if ($ref === '') fail('Reference number is required.');

$pdo = db();

function txn_col(PDO $pdo, string $col): bool {
    static $c = [];
    if (array_key_exists($col, $c)) return $c[$col];
    try {
        $s = $pdo->prepare("SELECT 1 AS x FROM sys.columns WHERE object_id = OBJECT_ID('dbo.toner_transactions') AND name = ?");
        $s->execute([$col]);
        $c[$col] = (bool)$s->fetch();
    } catch (Throwable $e) {
        $c[$col] = false;
    }
    return $c[$col];
}

function find_defective(PDO $pdo, string $ref): ?array {
    $ref = strtoupper(trim($ref));
    // Exact match first
    $st = $pdo->prepare(
        "SELECT * FROM dbo.toner_transactions WITH (UPDLOCK, ROWLOCK)
         WHERE UPPER(LTRIM(RTRIM(reference_number))) = ? AND type = 'DEFECTIVE'"
    );
    $st->execute([$ref]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if ($row) return array_change_key_case($row, CASE_LOWER);

    // Fallback: any DEFECTIVE row whose ref contains the ticket (handles prefixes)
    $st2 = $pdo->prepare(
        "SELECT TOP 1 * FROM dbo.toner_transactions WITH (UPDLOCK, ROWLOCK)
         WHERE type = 'DEFECTIVE' AND UPPER(LTRIM(RTRIM(reference_number))) LIKE ?
         ORDER BY id DESC"
    );
    $st2->execute(['%' . $ref . '%']);
    $row2 = $st2->fetch(PDO::FETCH_ASSOC);
    return $row2 ? array_change_key_case($row2, CASE_LOWER) : null;
}

try {
    // ---------- FLAG (original return defective from issuance) ----------
    if ($action === 'flag' || $action === 'flag_defective') {
        $pdo->beginTransaction();
        $rel = $pdo->prepare(
            "SELECT * FROM dbo.toner_transactions WITH (UPDLOCK, ROWLOCK)
             WHERE reference_number = ? AND type = 'RELEASED'"
        );
        $rel->execute([$ref]);
        $release = $rel->fetch(PDO::FETCH_ASSOC);
        if (!$release) {
            $pdo->rollBack();
            fail('No completed issuance found for this ticket.');
        }
        $release = array_change_key_case($release, CASE_LOWER);

        $already = $pdo->prepare(
            "SELECT id FROM dbo.toner_transactions WHERE reference_number = ? AND type = 'DEFECTIVE'"
        );
        $already->execute([$ref]);
        if ($already->fetch()) {
            $pdo->rollBack();
            fail('This issuance was already flagged as defective.');
        }

        $flag = $pdo->prepare(
            'UPDATE dbo.toner_transactions
             SET defective = 1, defective_at = SYSUTCDATETIME(), defective_notes = ?
             WHERE id = ?'
        );
        $flag->execute([$notes !== '' ? $notes : null, (int)$release['id']]);

        $txnCode = new_txn_code($pdo);
        $cols = ['txn_code', 'type', 'reference_number', 'ink_code', 'quantity', 'txn_date', 'department', 'location', 'purpose', 'status', 'defective', 'created_at'];
        $vals = ['?', "'DEFECTIVE'", '?', '?', '1', 'CAST(GETDATE() AS DATE)', '?', '?', '?', "'DEFECTIVE'", '1', 'SYSUTCDATETIME()'];
        $params = [
            $txnCode,
            $ref,
            $release['ink_code'],
            $release['department'] ?? null,
            $release['location'] ?? null,
            $notes !== '' ? $notes : 'Defective return',
        ];
        if (txn_col($pdo, 'recorded_by')) {
            $cols[] = 'recorded_by';
            $vals[] = '?';
            $params[] = $recordedBy;
        }
        $sql = 'INSERT INTO dbo.toner_transactions (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $vals) . ')';
        $pdo->prepare($sql)->execute($params);
        $pdo->commit();
        ok([
            'message' => 'Flagged as defective',
            'referenceNumber' => $ref,
            'inkCode' => $release['ink_code'],
            'txnCode' => $txnCode,
            'status' => 'DEFECTIVE',
        ]);
        activity_log('flag_defective', 'Flagged defective return', [
            'reference' => $ref,
            'itemCode' => $release['ink_code'] ?? '',
            'details' => 'Issuance marked defective',
        ]);
    }

    // ---------- SEND TO SUPPLIER ----------
    if ($action === 'send_to_supplier' || $action === 'send_supplier') {
        $pdo->beginTransaction();
        $def = find_defective($pdo, $ref);
        if (!$def) {
            $pdo->rollBack();
            fail('Defective record not found for this reference.');
        }
        $st = strtoupper((string)($def['status'] ?? 'DEFECTIVE'));
        if ($st === 'SENT_TO_SUPPLIER') {
            $pdo->rollBack();
            fail('Already marked as sent to supplier.');
        }
        if ($st === 'REPLACED') {
            $pdo->rollBack();
            fail('Replacement already received for this defective item.');
        }
        $sentAt = gmdate('Y-m-d\TH:i:s\Z');
        try {
            $sentAt = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
        } catch (Throwable $e) {}
        $prevNotes = (string)($def['defective_notes'] ?? '');
        // Store structured timestamps in notes: keep human notes, append meta lines
        $prevNotes = preg_replace('/\n?\[SENT_AT\].*$/m', '', $prevNotes);
        $newNotes = trim($prevNotes);
        if ($newNotes !== '') $newNotes .= "\n";
        $newNotes .= '[SENT_AT] ' . $sentAt;
        try {
            $upd = $pdo->prepare(
                "UPDATE dbo.toner_transactions
                 SET status = 'SENT_TO_SUPPLIER',
                     purpose = CASE
                       WHEN purpose IS NULL OR purpose = '' THEN 'Sent to supplier for replacement'
                       ELSE purpose
                     END,
                     defective_notes = ?
                 WHERE id = ?"
            );
            $upd->execute([$newNotes, (int)$def['id']]);
        } catch (Throwable $eNotes) {
            // Fallback if notes column issue
            $upd = $pdo->prepare(
                "UPDATE dbo.toner_transactions
                 SET status = 'SENT_TO_SUPPLIER',
                     purpose = 'Sent to supplier for replacement'
                 WHERE id = ?"
            );
            $upd->execute([(int)$def['id']]);
        }
        $pdo->commit();
        activity_log('send_to_supplier', 'Sent defective to supplier', [
            'reference' => $ref,
            'itemCode' => $def['ink_code'] ?? '',
            'details' => 'Defective unit sent to supplier for replacement',
        ]);
        ok([
            'message' => 'Marked as sent to supplier',
            'referenceNumber' => $ref,
            'status' => 'SENT_TO_SUPPLIER',
            'inkCode' => $def['ink_code'] ?? '',
        ]);
    }

    // ---------- RECEIVE REPLACEMENT ----------
    if ($action === 'receive_replacement' || $action === 'receive') {
        if ($acceptedBy === '') fail('Select the admin who accepted the replacement.');

        $pdo->beginTransaction();
        $def = find_defective($pdo, $ref);
        if (!$def) {
            $pdo->rollBack();
            fail('Defective record not found for this reference.');
        }
        $st = strtoupper((string)($def['status'] ?? 'DEFECTIVE'));
        if ($st === 'REPLACED') {
            $pdo->rollBack();
            fail('Replacement already received for this item.');
        }
        if ($st !== 'SENT_TO_SUPPLIER') {
            $pdo->rollBack();
            fail('Send this item to the supplier first before receiving a replacement.');
        }
        $inkCode = strtoupper(trim((string)$def['ink_code']));

        // Update defective row
        $recvAt = gmdate('Y-m-d\TH:i:s\Z');
        try {
            $recvAt = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
        } catch (Throwable $e) {}
        $prevNotes = (string)($def['defective_notes'] ?? '');
        $prevNotes = preg_replace('/\n?\[RECV_AT\].*$/m', '', $prevNotes);
        $prevNotes = preg_replace('/\n?\[ACCEPTED_BY\].*$/m', '', $prevNotes);
        $prevNotes = preg_replace('/\n?\[RECORDED_BY\].*$/m', '', $prevNotes);
        $newNotes = trim($prevNotes);
        if ($newNotes !== '') $newNotes .= "\n";
        $newNotes .= '[RECV_AT] ' . $recvAt . "\n[ACCEPTED_BY] " . $acceptedBy . "\n[RECORDED_BY] " . $recordedBy;

        $sets = ["status = 'REPLACED'"];
        $params = [];
        if (txn_col($pdo, 'issued_by')) {
            $sets[] = 'issued_by = ?'; // accepted by
            $params[] = $acceptedBy;
        }
        if (txn_col($pdo, 'recorded_by')) {
            $sets[] = 'recorded_by = ?';
            $params[] = $recordedBy;
        }
        $sets[] = "purpose = ?";
        $params[] = 'Replacement received from supplier';
        if (txn_col($pdo, 'defective_notes')) {
            $sets[] = 'defective_notes = ?';
            $params[] = $newNotes;
        }
        $params[] = (int)$def['id'];
        $pdo->prepare(
            'UPDATE dbo.toner_transactions SET ' . implode(', ', $sets) . ' WHERE id = ?'
        )->execute($params);

        // Stock +1
        $inv = $pdo->prepare(
            'SELECT * FROM dbo.toner_inventory WITH (UPDLOCK, ROWLOCK) WHERE item_code = ?'
        );
        $inv->execute([$inkCode]);
        $row = $inv->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $pdo->rollBack();
            fail("Item {$inkCode} not found in inventory. Cannot add replacement stock.");
        }
        $row = array_change_key_case($row, CASE_LOWER);
        $newQty = (int)$row['quantity'] + 1;
        $pdo->prepare(
            'UPDATE dbo.toner_inventory SET quantity = ?, updated_at = SYSUTCDATETIME() WHERE id = ?'
        )->execute([$newQty, (int)$row['id']]);

        // Log RECEIVED movement
        $txnCode = new_txn_code($pdo);
        $rCols = ['txn_code', 'type', 'reference_number', 'ink_code', 'quantity', 'txn_date', 'purpose', 'status', 'created_at'];
        $rVals = ['?', "'RECEIVED'", '?', '?', '1', 'CAST(GETDATE() AS DATE)', '?', "'RECORDED'", 'SYSUTCDATETIME()'];
        $rParams = [
            $txnCode,
            'REPL-' . $ref,
            $inkCode,
            "Supplier replacement for defective {$ref}",
        ];
        if (txn_col($pdo, 'issued_by')) {
            $rCols[] = 'issued_by';
            $rVals[] = '?';
            $rParams[] = $acceptedBy;
        }
        if (txn_col($pdo, 'recorded_by')) {
            $rCols[] = 'recorded_by';
            $rVals[] = '?';
            $rParams[] = $recordedBy;
        }
        if (txn_col($pdo, 'supplier')) {
            // optional leave null
        }
        $pdo->prepare(
            'INSERT INTO dbo.toner_transactions (' . implode(', ', $rCols) . ') VALUES (' . implode(', ', $rVals) . ')'
        )->execute($rParams);

        $pdo->commit();

        try { notify_low_stock($pdo); } catch (Throwable $e) { /* ignore */ }

        ok([
            'message' => 'Replacement received — stock increased by 1',
            'referenceNumber' => $ref,
            'replacementRef' => 'REPL-' . $ref,
            'inkCode' => $inkCode,
            'newStock' => $newQty,
            'acceptedBy' => $acceptedBy,
            'recordedBy' => $recordedBy,
            'status' => 'REPLACED',
            'txnCode' => $txnCode,
        ]);
        activity_log('receive_replacement', 'Received supplier replacement', [
            'reference' => $ref,
            'itemCode' => $inkCode,
            'details' => 'Replacement accepted by ' . $acceptedBy . '; stock +1',
        ]);
    }

    fail('Unknown action. Use flag, send_to_supplier, or receive_replacement.', 400);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail('Server error: ' . $e->getMessage(), 500);
}
