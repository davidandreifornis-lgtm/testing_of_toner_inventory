/*
  System activity logs + optional mail log support
  Run on database: toner_inventory
*/
USE toner_inventory;
GO

IF OBJECT_ID(N'dbo.toner_system_logs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_system_logs (
    id         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    action     NVARCHAR(64)  NOT NULL,
    message    NVARCHAR(500) NULL,
    reference  NVARCHAR(64)  NULL,
    item_code  NVARCHAR(64)  NULL,
    details    NVARCHAR(1000) NULL,
    username   NVARCHAR(128) NULL,
    ip_address NVARCHAR(64)  NULL,
    created_at DATETIME2     NOT NULL CONSTRAINT DF_toner_syslog_created DEFAULT (SYSUTCDATETIME())
  );
  CREATE INDEX IX_toner_system_logs_created ON dbo.toner_system_logs (created_at DESC);
  CREATE INDEX IX_toner_system_logs_action ON dbo.toner_system_logs (action);
END
GO

IF OBJECT_ID(N'dbo.toner_mail_log', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_mail_log (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    recipient   NVARCHAR(255) NULL,
    subject     NVARCHAR(255) NULL,
    body_preview NVARCHAR(500) NULL,
    success     BIT           NOT NULL CONSTRAINT DF_toner_maillog_ok DEFAULT (0),
    error_message NVARCHAR(500) NULL,
    item_codes  NVARCHAR(500) NULL,
    created_at  DATETIME2     NOT NULL CONSTRAINT DF_toner_maillog_created DEFAULT (SYSUTCDATETIME())
  );
  CREATE INDEX IX_toner_mail_log_created ON dbo.toner_mail_log (created_at DESC);
END
GO

PRINT 'migration_system_logs.sql applied.';
GO
