<?php
header('Content-Type: application/json; charset=utf-8');

$result = [
    'ok' => false,
    'status' => 'down',
    'database' => false,
    'php' => PHP_VERSION,
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'extensions' => [
        'sqlsrv' => extension_loaded('sqlsrv'),
        'pdo_sqlsrv' => extension_loaded('pdo_sqlsrv'),
    ],
];

try {
    require_once __DIR__ . '/../config/db_connect.php';
    $cfg = toner_db_config();
    $result['config'] = [
        'server' => $cfg['server'],
        'database' => $cfg['database'],
        'username' => $cfg['username'],
        'driver' => $cfg['driver'] ?? 'sqlsrv',
    ];

    $pdo = toner_pdo();
    $dbRow = $pdo->query('SELECT DB_NAME() AS dbname')->fetch(PDO::FETCH_ASSOC);
    $dbRow = array_change_key_case($dbRow ?: [], CASE_LOWER);
    $result['connected_database'] = $dbRow['dbname'] ?? null;

    $tables = [];
    $q = $pdo->query("SELECT name FROM sys.tables WHERE name IN ('toner_inventory','toner_transactions','toner_users') ORDER BY name");
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $r = array_change_key_case($r, CASE_LOWER);
        $tables[] = $r['name'];
    }
    $counts = [];
    foreach ($tables as $tb) {
        try {
            $c = $pdo->query("SELECT COUNT(*) AS c FROM dbo.[{$tb}]")->fetch(PDO::FETCH_ASSOC);
            $c = array_change_key_case($c ?: [], CASE_LOWER);
            $counts[$tb] = (int)($c['c'] ?? 0);
        } catch (Throwable $e) {
            $counts[$tb] = $e->getMessage();
        }
    }

    $result['ok'] = true;
    $result['status'] = 'up';
    $result['database'] = true;
    $result['tables'] = $tables;
    $result['row_counts'] = $counts;
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    $result['error'] = $e->getMessage();
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}