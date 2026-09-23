<?php
/**
 * Build PDO connection to SQL Server database toner_inventory.
 */
function toner_db_config(): array {
    return require __DIR__ . '/database.php';
}

function toner_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = toner_db_config();
    $server   = trim((string)($config['server'] ?? 'VMAPPS2'));
    $database = trim((string)($config['database'] ?? 'toner_inventory'));
    $user     = (string)($config['username'] ?? '');
    $pass     = (string)($config['password'] ?? '');
    $driver   = $config['driver'] ?? 'sqlsrv';
    $port     = trim((string)($config['port'] ?? ''));

    // Force correct database name
    if ($database === '' || strcasecmp($database, 'wlms') === 0) {
        $database = 'toner_inventory';
    }

    if (!in_array('sqlsrv', PDO::getAvailableDrivers(), true) && $driver === 'sqlsrv') {
        throw new RuntimeException(
            'PDO sqlsrv driver missing. Enable php_pdo_sqlsrv in php.ini and install ODBC Driver for SQL Server.'
        );
    }

    if ($driver === 'dblib') {
        $host = $port !== '' ? "{$server}:{$port}" : $server;
        $dsn = "dblib:host={$host};dbname={$database};charset=UTF-8";
    } else {
        $serverPart = $port !== '' ? "{$server},{$port}" : $server;
        // Explicit Database=toner_inventory
        $dsn = "sqlsrv:Server={$serverPart};Database={$database};TrustServerCertificate=yes;LoginTimeout=15";
    }

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    // Confirm we are on the right database
    try {
        $row = $pdo->query('SELECT DB_NAME() AS dbname')->fetch(PDO::FETCH_ASSOC);
        $row = array_change_key_case($row ?: [], CASE_LOWER);
        $actual = (string)($row['dbname'] ?? '');
        if ($actual !== '' && strcasecmp($actual, $database) !== 0) {
            throw new RuntimeException(
                "Connected to database '{$actual}' but config requires '{$database}'. Fix config/database.php."
            );
        }
    } catch (RuntimeException $e) {
        throw $e;
    } catch (Throwable $e) {
        // ignore if DB_NAME not allowed
    }

    return $pdo;
}