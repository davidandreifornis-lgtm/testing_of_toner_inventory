<?php
require_once __DIR__ . '/../config/bootstrap.php';
auth_require_api();

$pdo = db();

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        fail('Method not allowed', 405);
    }

    // Ensure table exists (clear message if schema not applied)
    try {
        $pdo->query('SELECT TOP 1 id FROM dbo.toner_transactions');
    } catch (Throwable $e) {
        fail(
            "Table dbo.toner_transactions is missing or inaccessible. Run sql/schema_sqlserver.sql on database toner_inventory. Detail: " . $e->getMessage(),
            500
        );
    }

    $type = strtoupper(trim($_GET['type'] ?? ''));
    $from = trim($_GET['from'] ?? '');
    $to = trim($_GET['to'] ?? '');

    $sql = 'SELECT * FROM dbo.toner_transactions WHERE 1 = 1';
    $params = [];

    if (in_array($type, ['RECEIVED', 'RELEASED', 'DEFECTIVE'], true)) {
        $sql .= ' AND type = ?';
        $params[] = $type;
    }
    if ($from !== '') {
        $sql .= ' AND txn_date >= ?';
        $params[] = $from;
    }
    if ($to !== '') {
        $sql .= ' AND txn_date <= ?';
        $params[] = $to;
    }

    $sql .= ' ORDER BY created_at DESC, id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($rows as $r) {
        $r = array_change_key_case($r, CASE_LOWER);
        $out[] = [
            'id' => (string)($r['txn_code'] ?? ''),
            'type' => (string)($r['type'] ?? ''),
            'referenceNumber' => (string)($r['reference_number'] ?? ''),
            'inkId' => '',
            'inkCode' => (string)($r['ink_code'] ?? ''),
            'serialNumber' => 'N/A',
            'brand' => '',
            'color' => '',
            'quantity' => (int)($r['quantity'] ?? 0),
            'date' => isset($r['txn_date']) ? substr((string)$r['txn_date'], 0, 10) : '',
            'supplier' => (string)($r['supplier'] ?? ''),
            'givenTo' => (string)($r['given_to'] ?? ''),
            'department' => (string)($r['department'] ?? ''),
            'location' => (string)($r['location'] ?? ''),
            'purpose' => (string)($r['purpose'] ?? ''),
            'status' => (string)($r['status'] ?? 'RECORDED'),
            'defective' => !empty($r['defective']),
            'createdAt' => (string)($r['created_at'] ?? ''),
            'actualYield' => isset($r['actual_yield']) && $r['actual_yield'] !== null ? (int)$r['actual_yield'] : null,
            'issuedBy' => (string)($r['issued_by'] ?? ''),
            'recordedBy' => (string)($r['recorded_by'] ?? ''),
            'locationPrinter' => (string)($r['location_printer'] ?? ''),
            'defectiveAt' => (string)($r['defective_at'] ?? ''),
            'defectiveNotes' => (string)($r['defective_notes'] ?? ''),
            'updatedAt' => (string)($r['updated_at'] ?? ''),
        ];
    }

    ok(['transactions' => $out]);
} catch (Throwable $e) {
    fail('Server error: ' . $e->getMessage(), 500);
}
