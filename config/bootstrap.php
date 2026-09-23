<?php
// Display and log times in Philippine Time
date_default_timezone_set('Asia/Manila');

/**
 * API bootstrap — SQL Server toner_inventory + session auth helpers.
 */
require_once __DIR__ . '/auth_lib.php';
require_once __DIR__ . '/db_connect.php';
auth_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db(): PDO {
    return toner_pdo();
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return $_POST ?: [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $code = 400, array $extra = []): void {
    respond(array_merge(['ok' => false, 'error' => $message], $extra), $code);
}

function ok($data = [], int $code = 200): void {
    respond(array_merge(['ok' => true], is_array($data) ? $data : ['data' => $data]), $code);
}

function normalize_ref(string $ref): string {
    return strtoupper(trim($ref));
}

function new_txn_code(PDO $pdo): string {
    $row = $pdo->query('SELECT COUNT(*) AS c FROM dbo.toner_transactions')->fetch(PDO::FETCH_ASSOC);
    $row = array_change_key_case($row ?: [], CASE_LOWER);
    $n = (int)($row['c'] ?? 0) + 1;
    return 'TXN-' . str_pad((string)$n, 5, '0', STR_PAD_LEFT) . '-' . strtoupper(bin2hex(random_bytes(2)));
}

function auth_require_api(): void {
    if (!auth_is_logged_in()) {
        fail('Unauthorized. Please log in.', 401);
    }
}
