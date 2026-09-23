<?php
require_once __DIR__ . '/config/auth_lib.php';
auth_start();

// Already logged in → app
if (auth_is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['username'] ?? '');
    $pass = (string)($_POST['password'] ?? '');
    if ($user === '' || $pass === '') {
        $error = 'Username and password are required.';
    } elseif (auth_check_credentials($user, $pass)) {
        auth_login($user);
        try {
            require_once __DIR__ . '/config/db_connect.php';
            if (!function_exists('db')) {
                function db(): PDO { return toner_pdo(); }
            }
            require_once __DIR__ . '/config/activity_log.php';
            activity_log('login', 'Admin signed in', [
                'details' => 'Successful login',
            ], $user);
        } catch (Throwable $e) { /* never block login */ }
        header('Location: index.php');
        exit;
    } else {
        $error = 'Invalid username or password.';
        // small delay against brute force
        usleep(400000);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login — Toner Inventory</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div class="px-6 py-5 border-b border-slate-100 bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900">Admin Login</h1>
            <p class="text-xs text-slate-500">Toner Inventory Management System</p>
          </div>
        </div>
      </div>
      <form method="post" action="login.php" class="p-6 space-y-4" autocomplete="on">
        <?php if ($error !== ''): ?>
          <div class="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            <?php echo htmlspecialchars($error); ?>
          </div>
        <?php endif; ?>
        <div>
          <label class="block text-sm font-semibold text-slate-800 mb-1" for="username">Username</label>
          <input id="username" name="username" type="text" required autofocus
            value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-800 mb-1" for="password">Password</label>
          <input id="password" name="password" type="password" required
            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit"
          class="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
          Sign in
        </button>
      </form>
    </div>
    <p class="text-center text-xs text-slate-400 mt-4">Authorized administrators only</p>
    <div class="mt-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-center text-xs text-slate-600">
      <div class="font-semibold text-slate-700 mb-1">Demo login (works offline)</div>
      <div>Username: <code class="font-mono bg-slate-100 px-1.5 py-0.5 rounded">admin</code></div>
      <div class="mt-0.5">Password: <code class="font-mono bg-slate-100 px-1.5 py-0.5 rounded">admin123</code></div>
      <p class="mt-2 text-[11px] text-slate-400">Uses config credentials when the database is unavailable. Inventory data still requires a live DB connection.</p>
    </div>
  </div>
</body>
</html>
