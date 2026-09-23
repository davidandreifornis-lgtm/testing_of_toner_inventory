/*
  Suppliers master list
  Run on database: toner_inventory
*/
USE toner_inventory;
GO

IF OBJECT_ID(N'dbo.toner_suppliers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_suppliers (
    id         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name       NVARCHAR(128) NOT NULL,
    is_active  BIT           NOT NULL CONSTRAINT DF_toner_sup_active DEFAULT (1),
    created_at DATETIME2     NOT NULL CONSTRAINT DF_toner_sup_created DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2     NOT NULL CONSTRAINT DF_toner_sup_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_toner_suppliers_name UNIQUE (name)
  );
END
GO

PRINT 'migration_suppliers.sql applied.';
GO
