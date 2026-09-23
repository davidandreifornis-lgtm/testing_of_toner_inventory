<?php
require_once __DIR__ . '/config/auth_lib.php';
auth_start();
$user = function_exists('auth_user') ? auth_user() : '';
try {
    if ($user !== '') {
        require_once __DIR__ . '/config/db_connect.php';
        if (!function_exists('db')) {
            function db(): PDO { return toner_pdo(); }
        }
        require_once __DIR__ . '/config/activity_log.php';
        activity_log('logout', 'Admin signed out', [
            'details' => 'Logged out of the system',
        ], $user);
    }
} catch (Throwable $e) { /* ignore */ }
auth_logout();
header('Location: login.php');
exit;
