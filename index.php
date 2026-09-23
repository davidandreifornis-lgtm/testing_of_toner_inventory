<?php
/**
 * Toner Inventory Management System — modular entry point
 * Requires admin session; assembles layout + page views.
 */
require_once __DIR__ . '/config/auth_lib.php';
auth_require_login();

$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
$scriptDir = rtrim($scriptDir, '/');
$apiBase = ($scriptDir === '' || $scriptDir === '.') ? '/api' : ($scriptDir . '/api');
$assetBase = ($scriptDir === '' || $scriptDir === '.') ? '' : $scriptDir;

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Toner Inventory</title>
  <meta name="description" content="Printer toner inventory management — deliveries, issuances, defective returns." />
  <script>window.TONER_API_BASE = <?php echo json_encode($apiBase); ?>;</script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
          },
          colors: {
            brand: { 50: '#f8fafc', 100: '#f1f5f9', 500: '#0f172a', 600: '#0f172a', 700: '#020617' }
          },
          boxShadow: {
            soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)',
          }
        }
      }
    };
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?php echo htmlspecialchars($assetBase); ?>/assets/css/app.css">
  <style id="modal-critical-css">
    .modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(15, 23, 42, 0.45) !important;
      z-index: 9999 !important;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-backdrop.open { display: flex !important; }
    .modal-panel {
      background: #fff;
      border-radius: 0.875rem;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
      max-height: 90vh;
      overflow: auto;
      width: 100%;
      position: relative;
      z-index: 10000;
    }
  </style>

</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
  <div id="app" class="flex min-h-screen">
    <?php require __DIR__ . '/views/layout/sidebar.php'; ?>
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
      <?php require __DIR__ . '/views/layout/header.php'; ?>
      <main id="main-content" class="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden">
        <?php require __DIR__ . '/views/dashboard.php'; ?>
        <?php require __DIR__ . '/views/inventory.php'; ?>
        <?php require __DIR__ . '/views/transactions.php'; ?>
        <?php require __DIR__ . '/views/settings.php'; ?>
      </main>
    </div>
  </div>

  <?php require __DIR__ . '/components/modals/delivery.php'; ?>
  <?php require __DIR__ . '/components/modals/release.php'; ?>
  <?php require __DIR__ . '/components/modals/defective.php'; ?>
  <?php require __DIR__ . '/components/modals/stock-card.php'; ?>
  <?php require __DIR__ . '/components/modals/add-toner.php'; ?>
  <?php require __DIR__ . '/components/modals/confirm.php'; ?>
  <?php require __DIR__ . '/views/layout/notifications.php'; ?>

  <div id="toast-container" class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"></div>

  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/utils.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/api.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/notifications.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/modals.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/charts.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/dashboard.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/inventory.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/delivery.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/release.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/defective.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/transactions.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/settings.js"></script>
  <script src="<?php echo htmlspecialchars($assetBase); ?>/assets/js/app.js"></script>
</body>
</html>
