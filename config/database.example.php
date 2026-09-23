<?php
/**
 * Copy to database.php and set real credentials.
 * The application uses the existing toner_inventory database (SQL Server).
 */
return [
    'driver'   => 'sqlsrv',
    'server'   => 'VMAPPS2',
    'database' => 'toner_inventory',
    'username' => 'your_username',
    'password' => 'your_password',
    'port'     => '',  // e.g. '1433' if required
];
