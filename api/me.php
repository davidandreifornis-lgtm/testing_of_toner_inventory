<?php
/** Current logged-in admin (for issuance recorded-by / issuer default). */
require_once __DIR__ . '/../config/bootstrap.php';
auth_require_api();

ok([
    'username' => auth_user(),
    'userId' => auth_user_id(),
    'fullName' => (string)($_SESSION['toner_full_name'] ?? auth_user()),
    'role' => (string)($_SESSION['toner_role'] ?? 'admin'),
]);
