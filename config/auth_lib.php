<?php

function auth_start(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function auth_config(): array {
    return require __DIR__ . '/auth.php';
}

/**
 * Try DB users first; fall back to config/auth.php for bootstrap.
 */
function auth_check_credentials(string $user, string $pass): bool {
    $user = trim($user);
    if ($user === '' || $pass === '') {
        return false;
    }

    // 1) Database users
    try {
        require_once __DIR__ . '/bootstrap_db_only.php';
        $pdo = db_only();
        $stmt = $pdo->prepare(
            'SELECT TOP 1 id, username, password_hash, full_name, role, is_active
             FROM dbo.toner_users WHERE username = ?'
        );
        $stmt->execute([$user]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row = array_change_key_case($row, CASE_LOWER);
            if (empty($row['is_active'])) {
                return false;
            }
            if (password_verify($pass, (string)$row['password_hash'])) {
                $GLOBALS['_auth_db_user'] = $row;
                return true;
            }
            return false;
        }
    } catch (Throwable $e) {
        // Table missing or DB down — fall through to config
        $GLOBALS['_auth_db_error'] = $e->getMessage();
    }

    // 2) Legacy config file (single admin)
    $cfg = auth_config();
    if (!hash_equals((string)$cfg['username'], $user)) {
        return false;
    }
    $hash = trim((string)($cfg['password_hash'] ?? ''));
    if ($hash !== '') {
        if (password_verify($pass, $hash)) {
            $GLOBALS['_auth_db_user'] = [
                'id' => 0,
                'username' => $user,
                'full_name' => 'Config Admin',
                'role' => 'admin',
            ];
            return true;
        }
        return false;
    }
    if (hash_equals((string)$cfg['password'], $pass)) {
        $GLOBALS['_auth_db_user'] = [
            'id' => 0,
            'username' => $user,
            'full_name' => 'Config Admin',
            'role' => 'admin',
        ];
        return true;
    }
    return false;
}

function auth_login(string $user): void {
    auth_start();
    session_regenerate_id(true);
    $info = $GLOBALS['_auth_db_user'] ?? ['username' => $user, 'role' => 'admin', 'id' => 0, 'full_name' => $user];
    $_SESSION['toner_admin'] = true;
    $_SESSION['toner_user'] = $info['username'] ?? $user;
    $_SESSION['toner_user_id'] = (int)($info['id'] ?? 0);
    $_SESSION['toner_role'] = $info['role'] ?? 'admin';
    $_SESSION['toner_full_name'] = $info['full_name'] ?? $user;
    $_SESSION['toner_login_at'] = time();
}

function auth_logout(): void {
    auth_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function auth_is_logged_in(): bool {
    auth_start();
    return !empty($_SESSION['toner_admin']);
}

function auth_require_login(): void {
    if (!auth_is_logged_in()) {
        $base = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
        $base = rtrim($base, '/');
        if (substr($base, -4) === '/api') {
            $base = dirname($base);
            if ($base === '\\' || $base === '.') $base = '';
            $base = rtrim(str_replace('\\', '/', $base), '/');
        }
        $login = ($base === '' ? '' : $base) . '/login.php';
        header('Location: ' . $login);
        exit;
    }
}

function auth_user(): string {
    auth_start();
    return (string)($_SESSION['toner_user'] ?? 'admin');
}

function auth_user_id(): int {
    auth_start();
    return (int)($_SESSION['toner_user_id'] ?? 0);
}