<?php
/**
 * Copy to mail.php. Do not hardcode production SMTP passwords in git.
 */
return [
    'admin_email' => getenv('ADMIN_EMAIL') ?: 'admin@example.com',
    'driver'      => getenv('MAIL_DRIVER') ?: 'log', // smtp | log | mail
    'smtp_host'   => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'smtp_port'   => (int)(getenv('SMTP_PORT') ?: 587),
    'smtp_user'   => getenv('SMTP_USER') ?: '',
    'smtp_pass'   => getenv('SMTP_PASS') ?: '',
    'from_name'   => 'Toner Inventory',
    'from_email'  => getenv('SMTP_USER') ?: 'noreply@example.com',
];
