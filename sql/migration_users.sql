/*
  Application users (multi-user login)
  Run on database: toner_inventory
*/
USE toner_inventory;
GO

IF OBJECT_ID(N'dbo.toner_users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_users (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    username      NVARCHAR(64)  NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name     NVARCHAR(128) NULL,
    role          NVARCHAR(32)  NOT NULL CONSTRAINT DF_toner_users_role DEFAULT (N'user'),
    is_active     BIT           NOT NULL CONSTRAINT DF_toner_users_active DEFAULT (1),
    created_at    DATETIME2     NOT NULL CONSTRAINT DF_toner_users_created DEFAULT (SYSUTCDATETIME()),
    updated_at    DATETIME2     NOT NULL CONSTRAINT DF_toner_users_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_toner_users_username UNIQUE (username)
  );
END
GO

/* No seed users — create accounts under Settings → Users, or use config/auth.php until then. */

PRINT 'migration_users.sql applied. Create users under Settings → Users (or use config/auth.php).';
GO
