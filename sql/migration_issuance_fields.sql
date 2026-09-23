/*
  Department / location / printer mappings for stock issuance
  Run on database: toner_inventory
*/
USE toner_inventory;
GO

IF OBJECT_ID(N'dbo.toner_locations', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_locations (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    department    NVARCHAR(64)  NOT NULL,
    location      NVARCHAR(128) NOT NULL,
    printer_name  NVARCHAR(128) NULL,
    is_active     BIT           NOT NULL CONSTRAINT DF_toner_loc_active DEFAULT (1),
    created_at    DATETIME2     NOT NULL CONSTRAINT DF_toner_loc_created DEFAULT (SYSUTCDATETIME()),
    updated_at    DATETIME2     NOT NULL CONSTRAINT DF_toner_loc_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_toner_locations_dept_loc UNIQUE (department, location)
  );
  CREATE INDEX IX_toner_locations_dept ON dbo.toner_locations (department) WHERE is_active = 1;
END
GO

/* Ensure issuance-related columns on transactions */
IF COL_LENGTH('dbo.toner_transactions', 'actual_yield') IS NULL
  ALTER TABLE dbo.toner_transactions ADD actual_yield INT NULL;
IF COL_LENGTH('dbo.toner_transactions', 'issued_by') IS NULL
  ALTER TABLE dbo.toner_transactions ADD issued_by NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.toner_transactions', 'recorded_by') IS NULL
  ALTER TABLE dbo.toner_transactions ADD recorded_by NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.toner_transactions', 'location_printer') IS NULL
  ALTER TABLE dbo.toner_transactions ADD location_printer NVARCHAR(128) NULL;
GO

PRINT 'migration_issuance_fields.sql applied.';
GO
