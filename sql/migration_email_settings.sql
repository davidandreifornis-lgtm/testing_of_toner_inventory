/*
  Email / SMTP settings stored in database
  Run on database: toner_inventory
*/
USE toner_inventory;
GO

IF OBJECT_ID(N'dbo.toner_email_settings', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_email_settings (
    id                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    alert_recipient   NVARCHAR(255) NULL,
    admin_email       NVARCHAR(255) NULL,
    driver            NVARCHAR(32)  NOT NULL CONSTRAINT DF_toner_mail_driver DEFAULT (N'smtp'),
    smtp_host         NVARCHAR(255) NULL,
    smtp_port         INT           NULL,
    smtp_encryption   NVARCHAR(16)  NULL,
    smtp_user         NVARCHAR(255) NULL,
    smtp_pass         NVARCHAR(512) NULL,  -- may be encrypted by app
    cooldown_hours    INT           NOT NULL CONSTRAINT DF_toner_mail_cd DEFAULT (12),
    last_alert_at     DATETIME2     NULL,
    created_at        DATETIME2     NOT NULL CONSTRAINT DF_toner_mail_created DEFAULT (SYSUTCDATETIME()),
    updated_at        DATETIME2     NOT NULL CONSTRAINT DF_toner_mail_updated DEFAULT (SYSUTCDATETIME())
  );
END
GO

PRINT 'migration_email_settings.sql applied.';
GO
