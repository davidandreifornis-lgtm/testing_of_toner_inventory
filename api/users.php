<?php
/**
 * User management CRUD against dbo.toner_users.
 * Admin role required for all operations except changing own password via PUT self.
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/activity_log.php';
auth_require_api();

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function users_table_ok(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    try {
        $pdo->query('SELECT TOP 1 id FROM dbo.toner_users');
        $done = true;
    } catch (Throwable $e) {
        fail(
            'Table dbo.toner_users is missing. Run sql/migration_users.sql on database toner_inventory. Detail: ' . $e->getMessage(),
            500
        );
    }
}

function map_user(array $r): array {
    $r = array_change_key_case($r, CASE_LOWER);
    return [
        'id' => (int)($r['id'] ?? 0),
        'username' => (string)($r['username'] ?? ''),
        'fullName' => (string)($r['full_name'] ?? ''),
        'role' => (string)($r['role'] ?? 'user'),
        'isActive' => !empty($r['is_active']),
        'createdAt' => (string)($r['created_at'] ?? ''),
        'updatedAt' => (string)($r['updated_at'] ?? ''),
    ];
}

try {
    users_table_ok($pdo);

    // GET — list users (admin) or current profile
    if ($method === 'GET') {
        $self = isset($_GET['self']) || (isset($_GET['me']) && $_GET['me']);
        if ($self) {
            $id = auth_user_id();
            if ($id < 1) {
                // Config-only login
                ok([
                    'user' => [
                        'id' => 0,
                        'username' => auth_user(),
                        'fullName' => function_exists('auth_full_name') ? auth_full_name() : auth_user(),
                        'role' => function_exists('auth_role') ? auth_role() : 'admin',
                        'isActive' => true,
                        'source' => 'config',
                    ],
                ]);
            }
            $st = $pdo->prepare('SELECT * FROM dbo.toner_users WHERE id = ?');
            $st->execute([$id]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) fail('User not found.', 404);
            ok(['user' => map_user($row)]);
        }

        if (!auth_is_admin()) {
            fail('Admin role required to list users.', 403);
        }
        $stmt = $pdo->query(
            'SELECT id, username, full_name, role, is_active, created_at, updated_at
             FROM dbo.toner_users
             ORDER BY username ASC'
        );
        $items = array_map('map_user', $stmt->fetchAll(PDO::FETCH_ASSOC));
        ok(['users' => $items, 'count' => count($items)]);
    }

    // POST — create user (admin only)
    if ($method === 'POST') {
        if (!auth_is_admin()) fail('Admin role required.', 403);
        $in = json_input();
        $username = strtolower(trim((string)($in['username'] ?? '')));
        $password = (string)($in['password'] ?? '');
        $fullName = trim((string)($in['fullName'] ?? $in['full_name'] ?? ''));
        $role = strtolower(trim((string)($in['role'] ?? 'user')));
        if (!in_array($role, ['admin', 'user'], true)) $role = 'user';

        if ($username === '' || !preg_match('/^[a-z0-9._-]{3,64}$/', $username)) {
            fail('Username must be 3–64 characters (letters, numbers, . _ -).');
        }
        if (strlen($password) < 6) fail('Password must be at least 6 characters.');

        $hash = password_hash($password, PASSWORD_DEFAULT);
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO dbo.toner_users (username, password_hash, full_name, role, is_active, created_at, updated_at)
                 OUTPUT INSERTED.*
                 VALUES (?, ?, ?, ?, 1, SYSUTCDATETIME(), SYSUTCDATETIME())'
            );
            $stmt->execute([$username, $hash, $fullName !== '' ? $fullName : null, $role]);
        } catch (Throwable $e) {
            fail('Could not create user (duplicate username?): ' . $e->getMessage(), 409);
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            $q = $pdo->prepare('SELECT * FROM dbo.toner_users WHERE username = ?');
            $q->execute([$username]);
            $row = $q->fetch(PDO::FETCH_ASSOC);
        }
        activity_log('add_user', 'Created user', [
            'details' => $username . ' (' . $role . ')',
        ]);
        ok(['user' => map_user($row), 'message' => 'User created'], 201);
    }

    // PUT — update user or change password
    if ($method === 'PUT') {
        $in = json_input();
        $id = (int)($in['id'] ?? 0);
        $isSelf = $id > 0 && $id === auth_user_id();

        if (!$isSelf && !auth_is_admin()) {
            fail('Admin role required.', 403);
        }
        if ($id < 1) fail('User id is required.');

        $st = $pdo->prepare('SELECT * FROM dbo.toner_users WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) fail('User not found.', 404);
        $row = array_change_key_case($row, CASE_LOWER);

        $fullName = array_key_exists('fullName', $in) || array_key_exists('full_name', $in)
            ? trim((string)($in['fullName'] ?? $in['full_name'] ?? ''))
            : (string)($row['full_name'] ?? '');

        $role = (string)($row['role'] ?? 'user');
        $isActive = !empty($row['is_active']);

        if (auth_is_admin() && !$isSelf) {
            if (isset($in['role'])) {
                $role = strtolower(trim((string)$in['role']));
                if (!in_array($role, ['admin', 'user'], true)) $role = 'user';
            }
            if (array_key_exists('isActive', $in) || array_key_exists('is_active', $in)) {
                $isActive = !empty($in['isActive'] ?? $in['is_active']);
            }
        }

        // Prevent deactivating or demoting the last admin
        if ((!$isActive || $role !== 'admin') && strtolower((string)$row['role']) === 'admin') {
            $cnt = (int)$pdo->query(
                "SELECT COUNT(*) FROM dbo.toner_users WHERE role = 'admin' AND is_active = 1 AND id <> " . (int)$id
            )->fetchColumn();
            if ($cnt < 1 && (!$isActive || $role !== 'admin')) {
                fail('Cannot deactivate or demote the last active admin.');
            }
        }

        $password = (string)($in['password'] ?? '');
        if ($password !== '') {
            if (strlen($password) < 6) fail('Password must be at least 6 characters.');
            // Self password change: require current password
            if ($isSelf && !auth_is_admin()) {
                $current = (string)($in['currentPassword'] ?? $in['current_password'] ?? '');
                if ($current === '' || !password_verify($current, (string)$row['password_hash'])) {
                    fail('Current password is incorrect.');
                }
            } elseif ($isSelf && auth_is_admin() && isset($in['currentPassword'])) {
                $current = (string)($in['currentPassword'] ?? '');
                if ($current !== '' && !password_verify($current, (string)$row['password_hash'])) {
                    fail('Current password is incorrect.');
                }
            }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $upd = $pdo->prepare(
                'UPDATE dbo.toner_users
                 SET full_name = ?, role = ?, is_active = ?, password_hash = ?, updated_at = SYSUTCDATETIME()
                 WHERE id = ?'
            );
            $upd->execute([$fullName !== '' ? $fullName : null, $role, $isActive ? 1 : 0, $hash, $id]);
        } else {
            $upd = $pdo->prepare(
                'UPDATE dbo.toner_users
                 SET full_name = ?, role = ?, is_active = ?, updated_at = SYSUTCDATETIME()
                 WHERE id = ?'
            );
            $upd->execute([$fullName !== '' ? $fullName : null, $role, $isActive ? 1 : 0, $id]);
        }

        $q = $pdo->prepare('SELECT * FROM dbo.toner_users WHERE id = ?');
        $q->execute([$id]);
        $updated = $q->fetch(PDO::FETCH_ASSOC);
        activity_log('edit_user', 'Updated user', [
            'details' => ($updated['username'] ?? '') . ($password !== '' ? ' (password changed)' : ''),
        ]);
        ok(['user' => map_user($updated), 'message' => 'User updated']);
    }

    // DELETE — soft-deactivate (admin only)
    if ($method === 'DELETE') {
        if (!auth_is_admin()) fail('Admin role required.', 403);
        $in = json_input();
        $id = (int)($in['id'] ?? $_GET['id'] ?? 0);
        if ($id < 1) fail('User id is required.');
        if ($id === auth_user_id()) fail('You cannot deactivate your own account.');

        $st = $pdo->prepare('SELECT * FROM dbo.toner_users WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) fail('User not found.', 404);
        $row = array_change_key_case($row, CASE_LOWER);

        if (strtolower((string)$row['role']) === 'admin') {
            $cnt = (int)$pdo->query(
                "SELECT COUNT(*) FROM dbo.toner_users WHERE role = 'admin' AND is_active = 1 AND id <> " . (int)$id
            )->fetchColumn();
            if ($cnt < 1) fail('Cannot deactivate the last active admin.');
        }

        $upd = $pdo->prepare(
            'UPDATE dbo.toner_users SET is_active = 0, updated_at = SYSUTCDATETIME() WHERE id = ?'
        );
        $upd->execute([$id]);
        activity_log('remove_user', 'Deactivated user', [
            'details' => (string)($row['username'] ?? $id),
        ]);
        ok(['deleted' => $id, 'message' => 'User deactivated']);
    }

    fail('Method not allowed', 405);
} catch (Throwable $e) {
    fail('Server error: ' . $e->getMessage(), 500);
}
