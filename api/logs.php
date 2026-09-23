<?php
/**
 * System activity logs — list with search, date, action, and admin filters.
 */
require_once __DIR__ . '/../config/bootstrap.php';
auth_require_api();

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET') {
    fail('Method not allowed', 405);
}

$limit = max(1, min(500, (int)($_GET['limit'] ?? 150)));
$q = trim((string)($_GET['q'] ?? ''));
$action = trim((string)($_GET['action'] ?? ''));
$actor = trim((string)($_GET['actor'] ?? ''));
$from = trim((string)($_GET['from'] ?? ''));
$to = trim((string)($_GET['to'] ?? ''));
$period = strtoupper(trim((string)($_GET['period'] ?? ''))); // TODAY|WEEK|MONTH|ALL

try {
    try {
        $pdo->query('SELECT TOP 1 id FROM dbo.toner_system_logs');
    } catch (Throwable $e) {
        fail(
            'Table dbo.toner_system_logs is missing. Run sql/migration_system_logs.sql on database toner_inventory. Detail: ' . $e->getMessage(),
            500
        );
    }

    // Resolve period into from/to if provided
    if ($period !== '' && $period !== 'ALL' && $period !== 'CUSTOM') {
        $today = new DateTimeImmutable('today');
        if ($period === 'TODAY') {
            $from = $today->format('Y-m-d');
            $to = $today->format('Y-m-d');
        } elseif ($period === 'WEEK') {
            $from = $today->modify('-6 days')->format('Y-m-d');
            $to = (new DateTimeImmutable('today'))->format('Y-m-d');
        } elseif ($period === 'MONTH') {
            $from = $today->format('Y-m-01');
            $to = $today->format('Y-m-d');
        }
    }

    $where = ['1 = 1'];
    $params = [];

    if ($q !== '') {
        $where[] = '(action_label LIKE ? OR details LIKE ? OR actor_username LIKE ? OR actor_name LIKE ?
                     OR reference_number LIKE ? OR item_code LIKE ? OR action_key LIKE ?)';
        $like = '%' . $q . '%';
        array_push($params, $like, $like, $like, $like, $like, $like, $like);
    }
    if ($action !== '' && strtoupper($action) !== 'ALL') {
        $where[] = 'action_key = ?';
        $params[] = $action;
    }
    if ($actor !== '' && strtoupper($actor) !== 'ALL') {
        $where[] = '(actor_username = ? OR actor_name = ?)';
        $params[] = $actor;
        $params[] = $actor;
    }
    if ($from !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
        $where[] = 'CAST(created_at AS DATE) >= ?';
        $params[] = $from;
    }
    if ($to !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        $where[] = 'CAST(created_at AS DATE) <= ?';
        $params[] = $to;
    }

    $whereSql = implode(' AND ', $where);

    $sql = 'SELECT TOP ' . (int)$limit . '
              id, action_key, action_label, details, reference_number, item_code,
              actor_username, actor_name, created_at
            FROM dbo.toner_system_logs
            WHERE ' . $whereSql . '
            ORDER BY created_at DESC, id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $items = array_map(function ($r) {
        $r = array_change_key_case($r, CASE_LOWER);
        return [
            'id' => (int)($r['id'] ?? 0),
            'actionKey' => (string)($r['action_key'] ?? ''),
            'actionLabel' => (string)($r['action_label'] ?? ''),
            'details' => (string)($r['details'] ?? ''),
            'referenceNumber' => (string)($r['reference_number'] ?? ''),
            'itemCode' => (string)($r['item_code'] ?? ''),
            'actorUsername' => (string)($r['actor_username'] ?? ''),
            'actorName' => (string)($r['actor_name'] ?? ''),
            'createdAt' => (string)($r['created_at'] ?? ''),
        ];
    }, $rows);

    // Distinct actions & actors for filter dropdowns
    $actions = [];
    $actors = [];
    try {
        $a = $pdo->query(
            'SELECT DISTINCT action_key, action_label FROM dbo.toner_system_logs ORDER BY action_label'
        )->fetchAll(PDO::FETCH_ASSOC);
        foreach ($a as $row) {
            $row = array_change_key_case($row, CASE_LOWER);
            $actions[] = [
                'key' => (string)($row['action_key'] ?? ''),
                'label' => (string)($row['action_label'] ?? ''),
            ];
        }
        $u = $pdo->query(
            'SELECT DISTINCT actor_username, actor_name FROM dbo.toner_system_logs ORDER BY actor_name, actor_username'
        )->fetchAll(PDO::FETCH_ASSOC);
        foreach ($u as $row) {
            $row = array_change_key_case($row, CASE_LOWER);
            $actors[] = [
                'username' => (string)($row['actor_username'] ?? ''),
                'name' => (string)($row['actor_name'] ?? ''),
            ];
        }
    } catch (Throwable $e) { /* ignore meta errors */ }

    ok([
        'logs' => $items,
        'count' => count($items),
        'filters' => [
            'q' => $q,
            'action' => $action,
            'actor' => $actor,
            'from' => $from,
            'to' => $to,
            'period' => $period,
        ],
        'meta' => [
            'actions' => $actions,
            'actors' => $actors,
        ],
    ]);
} catch (Throwable $e) {
    fail('Server error: ' . $e->getMessage(), 500);
}
