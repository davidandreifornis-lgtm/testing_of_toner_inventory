/*
  Toner Inventory — SQL Server schema (database: toner_inventory)
  Run against the existing toner_inventory database.
  Safe to re-run: uses IF NOT EXISTS patterns.
*/

USE toner_inventory;
GO

/* ---------- Core inventory ---------- */
IF OBJECT_ID(N'dbo.toner_inventory', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_inventory (
    id                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    item_code         NVARCHAR(64)  NOT NULL,
    description       NVARCHAR(255) NULL,
    printer_model     NVARCHAR(255) NULL,
    quantity          INT           NOT NULL CONSTRAINT DF_toner_inv_qty DEFAULT (0),
    reorder_level     INT           NOT NULL CONSTRAINT DF_toner_inv_reorder DEFAULT (3),
    supplier          NVARCHAR(128) NULL,
    last_mrr_no       NVARCHAR(64)  NULL,
    last_received_qty INT           NULL,
    last_received_date DATE         NULL,
    created_at        DATETIME2     NOT NULL CONSTRAINT DF_toner_inv_created DEFAULT (SYSUTCDATETIME()),
    updated_at        DATETIME2     NOT NULL CONSTRAINT DF_toner_inv_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_toner_inventory_item_code UNIQUE (item_code)
  );
END
GO

/* Ensure optional columns exist on older installs */
IF COL_LENGTH('dbo.toner_inventory', 'last_mrr_no') IS NULL
  ALTER TABLE dbo.toner_inventory ADD last_mrr_no NVARCHAR(64) NULL;
IF COL_LENGTH('dbo.toner_inventory', 'last_received_qty') IS NULL
  ALTER TABLE dbo.toner_inventory ADD last_received_qty INT NULL;
IF COL_LENGTH('dbo.toner_inventory', 'last_received_date') IS NULL
  ALTER TABLE dbo.toner_inventory ADD last_received_date DATE NULL;
IF COL_LENGTH('dbo.toner_inventory', 'description') IS NULL
  ALTER TABLE dbo.toner_inventory ADD description NVARCHAR(255) NULL;
GO

/* ---------- Transactions ---------- */
IF OBJECT_ID(N'dbo.toner_transactions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.toner_transactions (
    id                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    txn_code          NVARCHAR(48)  NOT NULL,
    type              NVARCHAR(20)  NOT NULL,  -- RECEIVED | RELEASED | DEFECTIVE
    reference_number  NVARCHAR(64)  NOT NULL,
    ink_code          NVARCHAR(64)  NOT NULL,
    quantity          INT           NOT NULL CONSTRAINT DF_toner_txn_qty DEFAULT (1),
    txn_date          DATE          NOT NULL,
    supplier          NVARCHAR(128) NULL,
    given_to          NVARCHAR(128) NULL,
    department        NVARCHAR(64)  NULL,
    location          NVARCHAR(128) NULL,
    purpose           NVARCHAR(255) NULL,
    status            NVARCHAR(32)  NOT NULL CONSTRAINT DF_toner_txn_status DEFAULT (N'RECORDED'),
    defective         BIT           NOT NULL CONSTRAINT DF_toner_txn_def DEFAULT (0),
    actual_yield      INT           NULL,
    issued_by         NVARCHAR(128) NULL,
    recorded_by       NVARCHAR(128) NULL,
    location_printer  NVARCHAR(128) NULL,
    notes             NVARCHAR(500) NULL,
    created_at        DATETIME2     NOT NULL CONSTRAINT DF_toner_txn_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_toner_transactions_ref UNIQUE (reference_number)
  );
  CREATE INDEX IX_toner_transactions_type_date ON dbo.toner_transactions (type, txn_date);
  CREATE INDEX IX_toner_transactions_ink ON dbo.toner_transactions (ink_code);
END
GO

IF COL_LENGTH('dbo.toner_transactions', 'actual_yield') IS NULL
  ALTER TABLE dbo.toner_transactions ADD actual_yield INT NULL;
IF COL_LENGTH('dbo.toner_transactions', 'issued_by') IS NULL
  ALTER TABLE dbo.toner_transactions ADD issued_by NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.toner_transactions', 'recorded_by') IS NULL
  ALTER TABLE dbo.toner_transactions ADD recorded_by NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.toner_transactions', 'location_printer') IS NULL
  ALTER TABLE dbo.toner_transactions ADD location_printer NVARCHAR(128) NULL;
IF COL_LENGTH('dbo.toner_transactions', 'notes') IS NULL
  ALTER TABLE dbo.toner_transactions ADD notes NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.toner_transactions', 'defective') IS NULL
  ALTER TABLE dbo.toner_transactions ADD defective BIT NOT NULL CONSTRAINT DF_toner_txn_def2 DEFAULT (0);
GO

PRINT 'schema_sqlserver.sql applied.';
GO
