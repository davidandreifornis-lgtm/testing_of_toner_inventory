<?php
require_once __DIR__ . '/db_connect.php';

function db_only(): PDO {
    return toner_pdo();
}