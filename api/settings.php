<?php
/**
 * Email configuration — stored in dbo.toner_email_settings (single active row).
 */
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/mailer.php';
auth_require_api();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = db();

function email_settings_row(PDO $pdo): ?array {
    try {
        $stmt = $pdo->query(
            'SELECT TOP 1 * FROM dbo.toner_email_settings ORDER BY id ASC'
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? array_change_key_case($row, CASE_LOWER) : null;
    } catch (Throwable $e) {
        fail(
            'Table dbo.toner_email_settings is missing. Run sql/migration_email_settings.sql on database toner_inventory. Detail: ' . $e->getMessage(),
            500
        );
    }
}

function map_email_public(array $cfg, bool $fromDbRow = false): array {
    $rawPass = (string)($cfg['smtp_pass'] ?? '');
    $hasPass = $rawPass !== '' && $rawPass !== 'YOUR_GMAIL_APP_PASSWORD_HERE';
    return [
        'admin_email' => (string)($cfg['admin_email'] ?? ''),
        'alert_recipient' => (string)($cfg['alert_recipient'] ?? $cfg['admin_email'] ?? ''),
        'from_email' => (string)($cfg['from_email'] ?? ''),
        'from_name' => (string)($cfg['from_name'] ?? ''),
        'subject_prefix' => (string)($cfg['subject_prefix'] ?? ''),
        'cooldown_hours' => (int)($cfg['cooldown_hours'] ?? 12),
        'driver' => (string)($cfg['driver'] ?? 'smtp'),
        'smtp_host' => (string)($cfg['smtp_host'] ?? ''),
        'smtp_port' => (int)($cfg['smtp_port'] ?? 465),
        'smtp_encryption' => strtolower((string)($cfg['smtp_encryption'] ?? 'ssl')),
        'smtp_user' => (string)($cfg['smtp_user'] ?? ''),
        'smtp_pass_set' => $hasPass,
        'smtp_pass' => '',
    ];
}

if ($method === 'GET') {
    $row = email_settings_row($pdo);
    if ($row) {
        ok(['email' => map_email_public($row, true), 'source' => 'database']);
    }
    // No row yet — expose defaults so UI can seed
    ok(['email' => map_email_public(mail_config()), 'source' => 'defaults']);
}

if ($method === 'POST' || $method === 'PUT') {
    $in = json_input();
    $email = isset($in['email']) && is_array($in['email']) ? $in['email'] : $in;

    $row = email_settings_row($pdo);
    $currentPass = $row['smtp_pass'] ?? '';

    $driver = 'smtp'; // always SMTP
    $enc = strtolower(trim((string)($email['smtp_encryption'] ?? ($row['smtp_encryption'] ?? 'ssl'))));
    if (!in_array($enc, ['tls', 'ssl', 'none'], true)) {
        $enc = 'ssl';
    }

    $host = trim((string)($email['smtp_host'] ?? ($row['smtp_host'] ?? '')));
    $user = trim((string)($email['smtp_user'] ?? ($row['smtp_user'] ?? '')));
    $fromEmail = $user; // always SMTP username
    $passIn = (string)($email['smtp_pass'] ?? '');
    if ($passIn === '' || $passIn === '********') {
        $pass = $currentPass; // keep existing (already encrypted or legacy plain)
    } else {
        $pass = mail_encrypt_pass($passIn); // store encrypted in DB
    }

    if ($host === '') fail('SMTP host is required.');
    if ($user === '') fail('SMTP username is required.');
    // from_email is tied to smtp username (already validated)

    // From address mirrors SMTP username; alert recipient is chosen admin email
    $alertRecipient = strtolower(trim((string)($email['alert_recipient'] ?? ($row['alert_recipient'] ?? ''))));
    if ($alertRecipient === '' || !filter_var($alertRecipient, FILTER_VALIDATE_EMAIL)) {
        fail('Alert recipient is required and must be a valid email (registered admin username).');
    }
    $adminEmail = $alertRecipient; // keep legacy column in sync
    $fromEmail = $user;
    $fromName = 'Toner Inventory System';
    $prefix = '[Toner Alert]';
    $port = (int)($email['smtp_port'] ?? ($row['smtp_port'] ?? 465));
    $cooldown = (int)($email['cooldown_hours'] ?? ($row['cooldown_hours'] ?? 12));
    if ($port <= 0) $port = 465;
    if ($cooldown < 0) $cooldown = 0;

    $actor = function_exists('auth_user') ? auth_user() : null;

    if ($row) {
        try {
            $sql = 'UPDATE dbo.toner_email_settings SET
                admin_email = ?, alert_recipient = ?, from_email = ?, from_name = ?, subject_prefix = ?,
                cooldown_hours = ?, driver = ?, smtp_host = ?, smtp_port = ?,
                smtp_encryption = ?, smtp_user = ?, smtp_pass = ?,
                updated_at = SYSUTCDATETIME(), updated_by = ?
              WHERE id = ?';
            $pdo->prepare($sql)->execute([
                $adminEmail, $alertRecipient, $fromEmail, $fromName, $prefix,
                $cooldown, $driver, $host, $port,
                $enc, $user, $pass,
                $actor, (int)$row['id'],
            ]);
        } catch (Throwable $eCol) {
            // Column not migrated yet — write admin_email only
            $sql = 'UPDATE dbo.toner_email_settings SET
                admin_email = ?, from_email = ?, from_name = ?, subject_prefix = ?,
                cooldown_hours = ?, driver = ?, smtp_host = ?, smtp_port = ?,
                smtp_encryption = ?, smtp_user = ?, smtp_pass = ?,
                updated_at = SYSUTCDATETIME(), updated_by = ?
              WHERE id = ?';
            $pdo->prepare($sql)->execute([
                $adminEmail, $fromEmail, $fromName, $prefix,
                $cooldown, $driver, $host, $port,
                $enc, $user, $pass,
                $actor, (int)$row['id'],
            ]);
        }
    } else {
        try {
            $sql = 'INSERT INTO dbo.toner_email_settings
                (admin_email, alert_recipient, from_email, from_name, subject_prefix, cooldown_hours, driver,
                 smtp_host, smtp_port, smtp_encryption, smtp_user, smtp_pass, updated_at, updated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), ?)';
            $pdo->prepare($sql)->execute([
                $adminEmail, $alertRecipient, $fromEmail, $fromName, $prefix, $cooldown, $driver,
                $host, $port, $enc, $user, $pass, $actor,
            ]);
        } catch (Throwable $eCol) {
            $sql = 'INSERT INTO dbo.toner_email_settings
                (admin_email, from_email, from_name, subject_prefix, cooldown_hours, driver,
                 smtp_host, smtp_port, smtp_encryption, smtp_user, smtp_pass, updated_at, updated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), ?)';
            $pdo->prepare($sql)->execute([
                $adminEmail, $fromEmail, $fromName, $prefix, $cooldown, $driver,
                $host, $port, $enc, $user, $pass, $actor,
            ]);
        }
    }

    try {
        require_once __DIR__ . '/../config/activity_log.php';
        activity_log('update_settings', 'Updated email configuration', [
            'details' => "SMTP {$host}:{$port} ({$enc}), driver {$driver}",
        ]);
    } catch (Throwable $e) { /* ignore */ }

    $fresh = email_settings_row($pdo) ?: mail_config();
    ok([
        'message' => 'Email settings saved to database',
        'email' => map_email_public($fresh),
        'source' => 'database',
    ]);
}

fail('Method not allowed', 405);
