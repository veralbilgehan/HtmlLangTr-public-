-- ============================================================
-- BIGShare MSSQL Tablo Oluşturma Scripti
-- Sunucu: bigshare.tr:8000  /  Veritabanı: bigshare
-- ============================================================

-- ── companies ────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'companies')
CREATE TABLE companies (
  id          NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  name        NVARCHAR(255) NOT NULL,
  address     NVARCHAR(MAX) NULL,
  phone       NVARCHAR(50)  NULL,
  email       NVARCHAR(255) NULL,
  created_at  DATETIME2     NULL DEFAULT GETDATE()
);

-- ── users ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
  id          NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  username    NVARCHAR(255) NOT NULL,
  password    NVARCHAR(MAX) NOT NULL,
  full_name   NVARCHAR(255) NOT NULL,
  role        NVARCHAR(50)  NOT NULL DEFAULT 'employee',
  company_id  NVARCHAR(36)  NULL REFERENCES companies(id),
  department  NVARCHAR(255) NULL,
  avatar      NVARCHAR(MAX) NULL,
  CONSTRAINT UQ_users_username UNIQUE (username)
);

-- ── activity_types ───────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'activity_types')
CREATE TABLE activity_types (
  id          NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  company_id  NVARCHAR(36)  NULL REFERENCES companies(id),
  name        NVARCHAR(255) NOT NULL,
  category    NVARCHAR(100) NOT NULL DEFAULT 'activity',
  points      INT           NOT NULL DEFAULT 1,
  is_default  BIT           NULL DEFAULT 0,
  created_at  DATETIME2     NULL DEFAULT GETDATE()
);

-- ── shifts ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'shifts')
CREATE TABLE shifts (
  id                 NVARCHAR(36) NOT NULL DEFAULT NEWID() PRIMARY KEY,
  user_id            NVARCHAR(36) NOT NULL REFERENCES users(id),
  company_id         NVARCHAR(36) NULL REFERENCES companies(id),
  start_time         DATETIME2    NOT NULL,
  end_time           DATETIME2    NULL,
  duration_seconds   INT          NULL,
  start_latitude     FLOAT        NULL,
  start_longitude    FLOAT        NULL,
  end_latitude       FLOAT        NULL,
  end_longitude      FLOAT        NULL,
  created_at         DATETIME2    NULL DEFAULT GETDATE()
);

-- ── activities ───────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'activities')
CREATE TABLE activities (
  id               NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  user_id          NVARCHAR(36)  NOT NULL REFERENCES users(id),
  company_id       NVARCHAR(36)  NULL REFERENCES companies(id),
  shift_id         NVARCHAR(36)  NULL REFERENCES shifts(id),
  activity_type_id NVARCHAR(36)  NULL REFERENCES activity_types(id),
  type             NVARCHAR(255) NOT NULL,
  start_time       DATETIME2     NOT NULL,
  end_time         DATETIME2     NULL,
  duration_minutes INT           NULL,
  notes            NVARCHAR(MAX) NULL,
  created_at       DATETIME2     NULL DEFAULT GETDATE()
);

-- ── sales_records ────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sales_records')
CREATE TABLE sales_records (
  id               NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  user_id          NVARCHAR(36)  NOT NULL REFERENCES users(id),
  company_id       NVARCHAR(36)  NULL REFERENCES companies(id),
  shift_id         NVARCHAR(36)  NULL REFERENCES shifts(id),
  activity_type_id NVARCHAR(36)  NULL REFERENCES activity_types(id),
  type             NVARCHAR(255) NOT NULL,
  quantity         INT           NULL DEFAULT 1,
  notes            NVARCHAR(MAX) NULL,
  created_at       DATETIME2     NULL DEFAULT GETDATE()
);

-- ── company_settings ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'company_settings')
CREATE TABLE company_settings (
  id                      NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  company_id              NVARCHAR(36)  NOT NULL REFERENCES companies(id),
  shift_start_time        NVARCHAR(10)  NOT NULL DEFAULT '09:00',
  shift_end_time          NVARCHAR(10)  NOT NULL DEFAULT '18:00',
  late_threshold_minutes  INT           NOT NULL DEFAULT 15,
  late_warning1           NVARCHAR(MAX) NOT NULL DEFAULT 'Mesai saatinde işyerinde olmadığınızdan kanuna ilişkin mazeretinizi bildiriniz.',
  late_warning2           NVARCHAR(MAX) NOT NULL DEFAULT 'Mesai başlangıç saatini geçmenize rağmen mesainizi başlatmadınız. Lütfen durumu yöneticinize bildirin.',
  late_warning3           NVARCHAR(MAX) NOT NULL DEFAULT 'Devamsızlık tutanağı düzenlenecektir. En kısa sürede işyerinizde bulununuz.',
  updated_at              DATETIME2     NULL DEFAULT GETDATE(),
  CONSTRAINT UQ_company_settings_company UNIQUE (company_id)
);

-- ── groups ───────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'groups')
CREATE TABLE groups (
  id          NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  name        NVARCHAR(255) NOT NULL,
  company_id  NVARCHAR(36)  NULL REFERENCES companies(id),
  created_by  NVARCHAR(36)  NULL REFERENCES users(id),
  created_at  DATETIME2     NULL DEFAULT GETDATE()
);

-- ── group_members ────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'group_members')
CREATE TABLE group_members (
  id         NVARCHAR(36) NOT NULL DEFAULT NEWID() PRIMARY KEY,
  group_id   NVARCHAR(36) NOT NULL REFERENCES groups(id),
  user_id    NVARCHAR(36) NOT NULL REFERENCES users(id),
  joined_at  DATETIME2    NULL DEFAULT GETDATE()
);

-- ── group_messages ───────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'group_messages')
CREATE TABLE group_messages (
  id         NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  group_id   NVARCHAR(36)  NOT NULL REFERENCES groups(id),
  sender_id  NVARCHAR(36)  NOT NULL REFERENCES users(id),
  content    NVARCHAR(MAX) NULL,
  file_url   NVARCHAR(MAX) NULL,
  file_name  NVARCHAR(255) NULL,
  file_size  INT           NULL,
  file_type  NVARCHAR(100) NULL,
  created_at DATETIME2     NULL DEFAULT GETDATE()
);

-- ── messages ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'messages')
CREATE TABLE messages (
  id           NVARCHAR(36)  NOT NULL DEFAULT NEWID() PRIMARY KEY,
  sender_id    NVARCHAR(36)  NOT NULL REFERENCES users(id),
  recipient_id NVARCHAR(36)  NOT NULL REFERENCES users(id),
  company_id   NVARCHAR(36)  NULL REFERENCES companies(id),
  content      NVARCHAR(MAX) NULL,
  file_url     NVARCHAR(MAX) NULL,
  file_name    NVARCHAR(255) NULL,
  file_size    INT           NULL,
  file_type    NVARCHAR(100) NULL,
  [read]       BIT           NULL DEFAULT 0,
  created_at   DATETIME2     NULL DEFAULT GETDATE()
);
