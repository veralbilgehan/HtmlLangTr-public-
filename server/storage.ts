import { randomUUID } from "crypto";
import { pool, poolConnect, sql } from "./db";
import type {
  User, InsertUser,
  Company, InsertCompany,
  Shift, InsertShift,
  Activity, InsertActivity,
  Message, InsertMessage,
  ActivityType, InsertActivityType,
  SalesRecord, InsertSalesRecord,
  CompanySettings, InsertCompanySettings,
  Group, InsertGroup,
  GroupMember,
  GroupMessage, InsertGroupMessage,
} from "@shared/schema";

// Helper: ensure pool is connected before any query
async function getPool() {
  await poolConnect;
  return pool;
}

export interface IStorage {
  getCompany(id: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  getCompanyUsers(companyId: string): Promise<User[]>;

  getActivityType(id: string): Promise<ActivityType | undefined>;
  getActivityTypesByCompany(companyId: string): Promise<ActivityType[]>;
  getDefaultActivityTypes(): Promise<ActivityType[]>;
  createActivityType(activityType: InsertActivityType): Promise<ActivityType>;
  updateActivityType(id: string, updates: Partial<ActivityType>): Promise<ActivityType | undefined>;

  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, updates: Partial<Shift>): Promise<Shift | undefined>;
  getActiveShift(userId: string): Promise<Shift | undefined>;
  getUserTodayShift(userId: string): Promise<Shift | undefined>;
  getUserShifts(userId: string): Promise<Shift[]>;
  getAllShifts(companyId: string | null): Promise<Shift[]>;

  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined>;
  getActiveActivity(userId: string): Promise<Activity | undefined>;
  getUserActivities(userId: string): Promise<Activity[]>;
  getAllActivities(companyId: string | null): Promise<Activity[]>;

  createSalesRecord(record: InsertSalesRecord): Promise<SalesRecord>;
  getUserSalesRecords(userId: string): Promise<SalesRecord[]>;
  getCompanySalesRecords(companyId: string): Promise<SalesRecord[]>;

  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  getUserMessages(userId: string): Promise<Message[]>;
  getConversation(user1Id: string, user2Id: string): Promise<Message[]>;
  getRecentConversationPartnerIds(userId: string): Promise<string[]>;

  getCompanySettings(companyId: string): Promise<CompanySettings | undefined>;
  upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;

  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getGroupsByCompany(companyId: string): Promise<Group[]>;
  getGroupsByUser(userId: string): Promise<Group[]>;
  addGroupMember(groupId: string, userId: string): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;
  createGroupMessage(msg: InsertGroupMessage): Promise<GroupMessage>;
  getGroupMessages(groupId: string): Promise<GroupMessage[]>;
  deleteGroup(id: string): Promise<void>;
}

// ─── Row mappers (SQL snake_case → TS camelCase) ─────────────────────────────

function mapCompany(r: any): Company {
  return {
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapUser(r: any): User {
  return {
    id: r.id,
    username: r.username,
    password: r.password,
    fullName: r.full_name,
    role: r.role,
    companyId: r.company_id ?? null,
    department: r.department ?? null,
    avatar: r.avatar ?? null,
  };
}

function mapActivityType(r: any): ActivityType {
  return {
    id: r.id,
    companyId: r.company_id ?? null,
    name: r.name,
    category: r.category,
    points: r.points,
    isDefault: r.is_default ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapShift(r: any): Shift {
  return {
    id: r.id,
    userId: r.user_id,
    companyId: r.company_id ?? null,
    startTime: r.start_time,
    endTime: r.end_time ?? null,
    durationSeconds: r.duration_seconds ?? null,
    startLatitude: r.start_latitude ?? null,
    startLongitude: r.start_longitude ?? null,
    endLatitude: r.end_latitude ?? null,
    endLongitude: r.end_longitude ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapActivity(r: any): Activity {
  return {
    id: r.id,
    userId: r.user_id,
    companyId: r.company_id ?? null,
    shiftId: r.shift_id ?? null,
    activityTypeId: r.activity_type_id ?? null,
    type: r.type,
    startTime: r.start_time,
    endTime: r.end_time ?? null,
    durationMinutes: r.duration_minutes ?? null,
    notes: r.notes ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapSalesRecord(r: any): SalesRecord {
  return {
    id: r.id,
    userId: r.user_id,
    companyId: r.company_id ?? null,
    shiftId: r.shift_id ?? null,
    activityTypeId: r.activity_type_id ?? null,
    type: r.type,
    quantity: r.quantity ?? null,
    notes: r.notes ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapMessage(r: any): Message {
  return {
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    companyId: r.company_id ?? null,
    content: r.content ?? null,
    fileUrl: r.file_url ?? null,
    fileName: r.file_name ?? null,
    fileSize: r.file_size ?? null,
    fileType: r.file_type ?? null,
    read: r.read ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapCompanySettings(r: any): CompanySettings {
  return {
    id: r.id,
    companyId: r.company_id,
    shiftStartTime: r.shift_start_time,
    shiftEndTime: r.shift_end_time,
    lateThresholdMinutes: r.late_threshold_minutes,
    lateWarning1: r.late_warning1,
    lateWarning2: r.late_warning2,
    lateWarning3: r.late_warning3,
    updatedAt: r.updated_at ?? null,
  };
}

function mapGroup(r: any): Group {
  return {
    id: r.id,
    name: r.name,
    companyId: r.company_id ?? null,
    createdBy: r.created_by ?? null,
    createdAt: r.created_at ?? null,
  };
}

function mapGroupMember(r: any): GroupMember {
  return {
    id: r.id,
    groupId: r.group_id,
    userId: r.user_id,
    joinedAt: r.joined_at ?? null,
  };
}

function mapGroupMessage(r: any): GroupMessage {
  return {
    id: r.id,
    groupId: r.group_id,
    senderId: r.sender_id,
    content: r.content ?? null,
    fileUrl: r.file_url ?? null,
    fileName: r.file_name ?? null,
    fileSize: r.file_size ?? null,
    fileType: r.file_type ?? null,
    createdAt: r.created_at ?? null,
  };
}

// ─── DatabaseStorage ──────────────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // ── Companies ──────────────────────────────────────────────────────────────
  async getCompany(id: string): Promise<Company | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM companies WHERE id = @id");
    return result.recordset[0] ? mapCompany(result.recordset[0]) : undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    const p = await getPool();
    const result = await p.request()
      .query("SELECT * FROM companies ORDER BY name");
    return result.recordset.map(mapCompany);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("name", sql.NVarChar(255), insertCompany.name)
      .input("address", sql.NVarChar(sql.MAX), insertCompany.address ?? null)
      .input("phone", sql.NVarChar(50), insertCompany.phone ?? null)
      .input("email", sql.NVarChar(255), insertCompany.email ?? null)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO companies (id, name, address, phone, email, created_at)
              VALUES (@id, @name, @address, @phone, @email, @createdAt)`);
    return { id, name: insertCompany.name, address: insertCompany.address ?? null, phone: insertCompany.phone ?? null, email: insertCompany.email ?? null, createdAt: now };
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const p = await getPool();
    const setClauses: string[] = [];
    const req = p.request().input("id", sql.NVarChar(36), id);
    if (updates.name !== undefined) { setClauses.push("name = @name"); req.input("name", sql.NVarChar(255), updates.name); }
    if (updates.address !== undefined) { setClauses.push("address = @address"); req.input("address", sql.NVarChar(sql.MAX), updates.address); }
    if (updates.phone !== undefined) { setClauses.push("phone = @phone"); req.input("phone", sql.NVarChar(50), updates.phone); }
    if (updates.email !== undefined) { setClauses.push("email = @email"); req.input("email", sql.NVarChar(255), updates.email); }
    if (setClauses.length === 0) return this.getCompany(id);
    await req.query(`UPDATE companies SET ${setClauses.join(", ")} WHERE id = @id`);
    return this.getCompany(id);
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM users WHERE id = @id");
    return result.recordset[0] ? mapUser(result.recordset[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("username", sql.NVarChar(255), username)
      .query("SELECT * FROM users WHERE username = @username");
    return result.recordset[0] ? mapUser(result.recordset[0]) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const p = await getPool();
    const id = randomUUID();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("username", sql.NVarChar(255), insertUser.username)
      .input("password", sql.NVarChar(sql.MAX), insertUser.password)
      .input("fullName", sql.NVarChar(255), insertUser.fullName)
      .input("role", sql.NVarChar(50), insertUser.role ?? "employee")
      .input("companyId", sql.NVarChar(36), insertUser.companyId ?? null)
      .input("department", sql.NVarChar(255), insertUser.department ?? null)
      .input("avatar", sql.NVarChar(sql.MAX), insertUser.avatar ?? null)
      .query(`INSERT INTO users (id, username, password, full_name, role, company_id, department, avatar)
              VALUES (@id, @username, @password, @fullName, @role, @companyId, @department, @avatar)`);
    return { id, username: insertUser.username, password: insertUser.password, fullName: insertUser.fullName, role: insertUser.role ?? "employee", companyId: insertUser.companyId ?? null, department: insertUser.department ?? null, avatar: insertUser.avatar ?? null };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const p = await getPool();
    const setClauses: string[] = [];
    const req = p.request().input("id", sql.NVarChar(36), id);
    if (updates.username !== undefined) { setClauses.push("username = @username"); req.input("username", sql.NVarChar(255), updates.username); }
    if (updates.password !== undefined) { setClauses.push("password = @password"); req.input("password", sql.NVarChar(sql.MAX), updates.password); }
    if (updates.fullName !== undefined) { setClauses.push("full_name = @fullName"); req.input("fullName", sql.NVarChar(255), updates.fullName); }
    if (updates.role !== undefined) { setClauses.push("role = @role"); req.input("role", sql.NVarChar(50), updates.role); }
    if (updates.companyId !== undefined) { setClauses.push("company_id = @companyId"); req.input("companyId", sql.NVarChar(36), updates.companyId); }
    if (updates.department !== undefined) { setClauses.push("department = @department"); req.input("department", sql.NVarChar(255), updates.department); }
    if (updates.avatar !== undefined) { setClauses.push("avatar = @avatar"); req.input("avatar", sql.NVarChar(sql.MAX), updates.avatar); }
    if (setClauses.length === 0) return this.getUser(id);
    await req.query(`UPDATE users SET ${setClauses.join(", ")} WHERE id = @id`);
    return this.getUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    const p = await getPool();
    const result = await p.request().query("SELECT * FROM users");
    return result.recordset.map(mapUser);
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    const p = await getPool();
    const result = await p.request()
      .input("companyId", sql.NVarChar(36), companyId)
      .query("SELECT * FROM users WHERE company_id = @companyId");
    return result.recordset.map(mapUser);
  }

  async getCompanyUsers(companyId: string): Promise<User[]> {
    return this.getUsersByCompany(companyId);
  }

  // ── Activity Types ─────────────────────────────────────────────────────────
  async getActivityType(id: string): Promise<ActivityType | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM activity_types WHERE id = @id");
    return result.recordset[0] ? mapActivityType(result.recordset[0]) : undefined;
  }

  async getActivityTypesByCompany(companyId: string): Promise<ActivityType[]> {
    const p = await getPool();
    const result = await p.request()
      .input("companyId", sql.NVarChar(36), companyId)
      .query("SELECT * FROM activity_types WHERE company_id = @companyId OR is_default = 1 ORDER BY name");
    return result.recordset.map(mapActivityType);
  }

  async getDefaultActivityTypes(): Promise<ActivityType[]> {
    const p = await getPool();
    const result = await p.request()
      .query("SELECT * FROM activity_types WHERE is_default = 1 ORDER BY name");
    return result.recordset.map(mapActivityType);
  }

  async createActivityType(insertActivityType: InsertActivityType): Promise<ActivityType> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("companyId", sql.NVarChar(36), insertActivityType.companyId ?? null)
      .input("name", sql.NVarChar(255), insertActivityType.name)
      .input("category", sql.NVarChar(100), insertActivityType.category ?? "activity")
      .input("points", sql.Int, insertActivityType.points ?? 1)
      .input("isDefault", sql.Bit, insertActivityType.isDefault ? 1 : 0)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO activity_types (id, company_id, name, category, points, is_default, created_at)
              VALUES (@id, @companyId, @name, @category, @points, @isDefault, @createdAt)`);
    return { id, companyId: insertActivityType.companyId ?? null, name: insertActivityType.name, category: insertActivityType.category ?? "activity", points: insertActivityType.points ?? 1, isDefault: insertActivityType.isDefault ?? null, createdAt: now };
  }

  async updateActivityType(id: string, updates: Partial<ActivityType>): Promise<ActivityType | undefined> {
    const p = await getPool();
    const setClauses: string[] = [];
    const req = p.request().input("id", sql.NVarChar(36), id);
    if (updates.name !== undefined) { setClauses.push("name = @name"); req.input("name", sql.NVarChar(255), updates.name); }
    if (updates.category !== undefined) { setClauses.push("category = @category"); req.input("category", sql.NVarChar(100), updates.category); }
    if (updates.points !== undefined) { setClauses.push("points = @points"); req.input("points", sql.Int, updates.points); }
    if (updates.isDefault !== undefined) { setClauses.push("is_default = @isDefault"); req.input("isDefault", sql.Bit, updates.isDefault ? 1 : 0); }
    if (setClauses.length === 0) return this.getActivityType(id);
    await req.query(`UPDATE activity_types SET ${setClauses.join(", ")} WHERE id = @id`);
    return this.getActivityType(id);
  }

  // ── Shifts ─────────────────────────────────────────────────────────────────
  async createShift(insertShift: InsertShift): Promise<Shift> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("userId", sql.NVarChar(36), insertShift.userId)
      .input("companyId", sql.NVarChar(36), insertShift.companyId ?? null)
      .input("startTime", sql.DateTime2, insertShift.startTime)
      .input("endTime", sql.DateTime2, insertShift.endTime ?? null)
      .input("durationSeconds", sql.Int, insertShift.durationSeconds ?? null)
      .input("startLat", sql.Float, insertShift.startLatitude ?? null)
      .input("startLng", sql.Float, insertShift.startLongitude ?? null)
      .input("endLat", sql.Float, insertShift.endLatitude ?? null)
      .input("endLng", sql.Float, insertShift.endLongitude ?? null)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO shifts (id, user_id, company_id, start_time, end_time, duration_seconds, start_latitude, start_longitude, end_latitude, end_longitude, created_at)
              VALUES (@id, @userId, @companyId, @startTime, @endTime, @durationSeconds, @startLat, @startLng, @endLat, @endLng, @createdAt)`);
    return { id, userId: insertShift.userId, companyId: insertShift.companyId ?? null, startTime: insertShift.startTime, endTime: insertShift.endTime ?? null, durationSeconds: insertShift.durationSeconds ?? null, startLatitude: insertShift.startLatitude ?? null, startLongitude: insertShift.startLongitude ?? null, endLatitude: insertShift.endLatitude ?? null, endLongitude: insertShift.endLongitude ?? null, createdAt: now };
  }

  async updateShift(id: string, updates: Partial<Shift>): Promise<Shift | undefined> {
    const p = await getPool();
    const setClauses: string[] = [];
    const req = p.request().input("id", sql.NVarChar(36), id);
    if (updates.endTime !== undefined) { setClauses.push("end_time = @endTime"); req.input("endTime", sql.DateTime2, updates.endTime); }
    if (updates.durationSeconds !== undefined) { setClauses.push("duration_seconds = @durationSeconds"); req.input("durationSeconds", sql.Int, updates.durationSeconds); }
    if (updates.endLatitude !== undefined) { setClauses.push("end_latitude = @endLat"); req.input("endLat", sql.Float, updates.endLatitude); }
    if (updates.endLongitude !== undefined) { setClauses.push("end_longitude = @endLng"); req.input("endLng", sql.Float, updates.endLongitude); }
    if (setClauses.length === 0) return this.getShiftById(id);
    await req.query(`UPDATE shifts SET ${setClauses.join(", ")} WHERE id = @id`);
    return this.getShiftById(id);
  }

  private async getShiftById(id: string): Promise<Shift | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM shifts WHERE id = @id");
    return result.recordset[0] ? mapShift(result.recordset[0]) : undefined;
  }

  async getActiveShift(userId: string): Promise<Shift | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT TOP 1 * FROM shifts WHERE user_id = @userId AND end_time IS NULL ORDER BY start_time DESC");
    return result.recordset[0] ? mapShift(result.recordset[0]) : undefined;
  }

  async getUserTodayShift(userId: string): Promise<Shift | undefined> {
    const p = await getPool();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .input("startOfDay", sql.DateTime2, startOfDay)
      .query("SELECT TOP 1 * FROM shifts WHERE user_id = @userId AND start_time >= @startOfDay ORDER BY start_time DESC");
    return result.recordset[0] ? mapShift(result.recordset[0]) : undefined;
  }

  async getUserShifts(userId: string): Promise<Shift[]> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT * FROM shifts WHERE user_id = @userId ORDER BY start_time DESC");
    return result.recordset.map(mapShift);
  }

  async getAllShifts(companyId: string | null): Promise<Shift[]> {
    const p = await getPool();
    if (companyId) {
      const result = await p.request()
        .input("companyId", sql.NVarChar(36), companyId)
        .query(`SELECT s.* FROM shifts s
                INNER JOIN users u ON s.user_id = u.id
                WHERE u.company_id = @companyId
                ORDER BY s.start_time DESC`);
      return result.recordset.map(mapShift);
    }
    const result = await p.request()
      .query("SELECT * FROM shifts ORDER BY start_time DESC");
    return result.recordset.map(mapShift);
  }

  // ── Activities ─────────────────────────────────────────────────────────────
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("userId", sql.NVarChar(36), insertActivity.userId)
      .input("companyId", sql.NVarChar(36), insertActivity.companyId ?? null)
      .input("shiftId", sql.NVarChar(36), insertActivity.shiftId ?? null)
      .input("activityTypeId", sql.NVarChar(36), insertActivity.activityTypeId ?? null)
      .input("type", sql.NVarChar(255), insertActivity.type)
      .input("startTime", sql.DateTime2, insertActivity.startTime)
      .input("endTime", sql.DateTime2, insertActivity.endTime ?? null)
      .input("durationMinutes", sql.Int, insertActivity.durationMinutes ?? null)
      .input("notes", sql.NVarChar(sql.MAX), insertActivity.notes ?? null)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO activities (id, user_id, company_id, shift_id, activity_type_id, type, start_time, end_time, duration_minutes, notes, created_at)
              VALUES (@id, @userId, @companyId, @shiftId, @activityTypeId, @type, @startTime, @endTime, @durationMinutes, @notes, @createdAt)`);
    return { id, userId: insertActivity.userId, companyId: insertActivity.companyId ?? null, shiftId: insertActivity.shiftId ?? null, activityTypeId: insertActivity.activityTypeId ?? null, type: insertActivity.type, startTime: insertActivity.startTime, endTime: insertActivity.endTime ?? null, durationMinutes: insertActivity.durationMinutes ?? null, notes: insertActivity.notes ?? null, createdAt: now };
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined> {
    const p = await getPool();
    const setClauses: string[] = [];
    const req = p.request().input("id", sql.NVarChar(36), id);
    if (updates.endTime !== undefined) { setClauses.push("end_time = @endTime"); req.input("endTime", sql.DateTime2, updates.endTime); }
    if (updates.durationMinutes !== undefined) { setClauses.push("duration_minutes = @durationMinutes"); req.input("durationMinutes", sql.Int, updates.durationMinutes); }
    if (updates.notes !== undefined) { setClauses.push("notes = @notes"); req.input("notes", sql.NVarChar(sql.MAX), updates.notes); }
    if (updates.type !== undefined) { setClauses.push("type = @type"); req.input("type", sql.NVarChar(255), updates.type); }
    if (setClauses.length === 0) return this.getActivityById(id);
    await req.query(`UPDATE activities SET ${setClauses.join(", ")} WHERE id = @id`);
    return this.getActivityById(id);
  }

  private async getActivityById(id: string): Promise<Activity | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM activities WHERE id = @id");
    return result.recordset[0] ? mapActivity(result.recordset[0]) : undefined;
  }

  async getActiveActivity(userId: string): Promise<Activity | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT TOP 1 * FROM activities WHERE user_id = @userId AND end_time IS NULL ORDER BY start_time DESC");
    return result.recordset[0] ? mapActivity(result.recordset[0]) : undefined;
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT * FROM activities WHERE user_id = @userId ORDER BY created_at DESC");
    return result.recordset.map(mapActivity);
  }

  async getAllActivities(companyId: string | null): Promise<Activity[]> {
    const p = await getPool();
    if (companyId) {
      const result = await p.request()
        .input("companyId", sql.NVarChar(36), companyId)
        .query(`SELECT a.* FROM activities a
                INNER JOIN users u ON a.user_id = u.id
                WHERE u.company_id = @companyId
                ORDER BY a.start_time DESC`);
      return result.recordset.map(mapActivity);
    }
    const result = await p.request()
      .query("SELECT * FROM activities ORDER BY start_time DESC");
    return result.recordset.map(mapActivity);
  }

  // ── Sales Records ──────────────────────────────────────────────────────────
  async createSalesRecord(insertRecord: InsertSalesRecord): Promise<SalesRecord> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("userId", sql.NVarChar(36), insertRecord.userId)
      .input("companyId", sql.NVarChar(36), insertRecord.companyId ?? null)
      .input("shiftId", sql.NVarChar(36), insertRecord.shiftId ?? null)
      .input("activityTypeId", sql.NVarChar(36), insertRecord.activityTypeId ?? null)
      .input("type", sql.NVarChar(255), insertRecord.type)
      .input("quantity", sql.Int, insertRecord.quantity ?? 1)
      .input("notes", sql.NVarChar(sql.MAX), insertRecord.notes ?? null)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO sales_records (id, user_id, company_id, shift_id, activity_type_id, type, quantity, notes, created_at)
              VALUES (@id, @userId, @companyId, @shiftId, @activityTypeId, @type, @quantity, @notes, @createdAt)`);
    return { id, userId: insertRecord.userId, companyId: insertRecord.companyId ?? null, shiftId: insertRecord.shiftId ?? null, activityTypeId: insertRecord.activityTypeId ?? null, type: insertRecord.type, quantity: insertRecord.quantity ?? 1, notes: insertRecord.notes ?? null, createdAt: now };
  }

  async getUserSalesRecords(userId: string): Promise<SalesRecord[]> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT * FROM sales_records WHERE user_id = @userId ORDER BY created_at DESC");
    return result.recordset.map(mapSalesRecord);
  }

  async getCompanySalesRecords(companyId: string): Promise<SalesRecord[]> {
    const p = await getPool();
    const result = await p.request()
      .input("companyId", sql.NVarChar(36), companyId)
      .query("SELECT * FROM sales_records WHERE company_id = @companyId ORDER BY created_at DESC");
    return result.recordset.map(mapSalesRecord);
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("senderId", sql.NVarChar(36), insertMessage.senderId)
      .input("recipientId", sql.NVarChar(36), insertMessage.recipientId)
      .input("companyId", sql.NVarChar(36), insertMessage.companyId ?? null)
      .input("content", sql.NVarChar(sql.MAX), insertMessage.content ?? null)
      .input("fileUrl", sql.NVarChar(sql.MAX), insertMessage.fileUrl ?? null)
      .input("fileName", sql.NVarChar(255), insertMessage.fileName ?? null)
      .input("fileSize", sql.Int, insertMessage.fileSize ?? null)
      .input("fileType", sql.NVarChar(100), insertMessage.fileType ?? null)
      .input("read", sql.Bit, 0)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO messages (id, sender_id, recipient_id, company_id, content, file_url, file_name, file_size, file_type, [read], created_at)
              VALUES (@id, @senderId, @recipientId, @companyId, @content, @fileUrl, @fileName, @fileSize, @fileType, @read, @createdAt)`);
    return { id, senderId: insertMessage.senderId, recipientId: insertMessage.recipientId, companyId: insertMessage.companyId ?? null, content: insertMessage.content ?? null, fileUrl: insertMessage.fileUrl ?? null, fileName: insertMessage.fileName ?? null, fileSize: insertMessage.fileSize ?? null, fileType: insertMessage.fileType ?? null, read: false, createdAt: now };
  }

  async markMessageAsRead(id: string): Promise<void> {
    const p = await getPool();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("UPDATE messages SET [read] = 1 WHERE id = @id");
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT * FROM messages WHERE sender_id = @userId OR recipient_id = @userId ORDER BY created_at DESC");
    return result.recordset.map(mapMessage);
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    const p = await getPool();
    const result = await p.request()
      .input("u1", sql.NVarChar(36), user1Id)
      .input("u2", sql.NVarChar(36), user2Id)
      .query(`SELECT * FROM messages
              WHERE (sender_id = @u1 AND recipient_id = @u2)
                 OR (sender_id = @u2 AND recipient_id = @u1)
              ORDER BY created_at ASC`);
    return result.recordset.map(mapMessage);
  }

  async getRecentConversationPartnerIds(userId: string): Promise<string[]> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query(`SELECT sender_id, recipient_id FROM messages
              WHERE sender_id = @userId OR recipient_id = @userId
              ORDER BY created_at DESC`);
    const seen = new Set<string>();
    const partnerIds: string[] = [];
    for (const row of result.recordset) {
      const partnerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        partnerIds.push(partnerId);
      }
    }
    return partnerIds;
  }

  // ── Company Settings ───────────────────────────────────────────────────────
  async getCompanySettings(companyId: string): Promise<CompanySettings | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("companyId", sql.NVarChar(36), companyId)
      .query("SELECT * FROM company_settings WHERE company_id = @companyId");
    return result.recordset[0] ? mapCompanySettings(result.recordset[0]) : undefined;
  }

  async upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings(settings.companyId);
    const p = await getPool();
    const now = new Date();
    if (existing) {
      await p.request()
        .input("companyId", sql.NVarChar(36), settings.companyId)
        .input("shiftStartTime", sql.NVarChar(10), settings.shiftStartTime)
        .input("shiftEndTime", sql.NVarChar(10), settings.shiftEndTime)
        .input("lateThresholdMinutes", sql.Int, settings.lateThresholdMinutes)
        .input("lateWarning1", sql.NVarChar(sql.MAX), settings.lateWarning1)
        .input("lateWarning2", sql.NVarChar(sql.MAX), settings.lateWarning2)
        .input("lateWarning3", sql.NVarChar(sql.MAX), settings.lateWarning3)
        .input("updatedAt", sql.DateTime2, now)
        .query(`UPDATE company_settings SET
                  shift_start_time = @shiftStartTime,
                  shift_end_time = @shiftEndTime,
                  late_threshold_minutes = @lateThresholdMinutes,
                  late_warning1 = @lateWarning1,
                  late_warning2 = @lateWarning2,
                  late_warning3 = @lateWarning3,
                  updated_at = @updatedAt
                WHERE company_id = @companyId`);
      return { ...existing, ...settings, updatedAt: now };
    } else {
      const id = randomUUID();
      await p.request()
        .input("id", sql.NVarChar(36), id)
        .input("companyId", sql.NVarChar(36), settings.companyId)
        .input("shiftStartTime", sql.NVarChar(10), settings.shiftStartTime)
        .input("shiftEndTime", sql.NVarChar(10), settings.shiftEndTime)
        .input("lateThresholdMinutes", sql.Int, settings.lateThresholdMinutes)
        .input("lateWarning1", sql.NVarChar(sql.MAX), settings.lateWarning1)
        .input("lateWarning2", sql.NVarChar(sql.MAX), settings.lateWarning2)
        .input("lateWarning3", sql.NVarChar(sql.MAX), settings.lateWarning3)
        .input("updatedAt", sql.DateTime2, now)
        .query(`INSERT INTO company_settings (id, company_id, shift_start_time, shift_end_time, late_threshold_minutes, late_warning1, late_warning2, late_warning3, updated_at)
                VALUES (@id, @companyId, @shiftStartTime, @shiftEndTime, @lateThresholdMinutes, @lateWarning1, @lateWarning2, @lateWarning3, @updatedAt)`);
      return { id, ...settings, updatedAt: now };
    }
  }

  // ── Groups ─────────────────────────────────────────────────────────────────
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("name", sql.NVarChar(255), insertGroup.name)
      .input("companyId", sql.NVarChar(36), insertGroup.companyId ?? null)
      .input("createdBy", sql.NVarChar(36), insertGroup.createdBy ?? null)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO groups (id, name, company_id, created_by, created_at)
              VALUES (@id, @name, @companyId, @createdBy, @createdAt)`);
    return { id, name: insertGroup.name, companyId: insertGroup.companyId ?? null, createdBy: insertGroup.createdBy ?? null, createdAt: now };
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const p = await getPool();
    const result = await p.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM groups WHERE id = @id");
    return result.recordset[0] ? mapGroup(result.recordset[0]) : undefined;
  }

  async getGroupsByCompany(companyId: string): Promise<Group[]> {
    const p = await getPool();
    const result = await p.request()
      .input("companyId", sql.NVarChar(36), companyId)
      .query("SELECT * FROM groups WHERE company_id = @companyId ORDER BY name");
    return result.recordset.map(mapGroup);
  }

  async getGroupsByUser(userId: string): Promise<Group[]> {
    const p = await getPool();
    const result = await p.request()
      .input("userId", sql.NVarChar(36), userId)
      .query(`SELECT g.* FROM groups g
              INNER JOIN group_members gm ON g.id = gm.group_id
              WHERE gm.user_id = @userId
              ORDER BY g.name`);
    return result.recordset.map(mapGroup);
  }

  async addGroupMember(groupId: string, userId: string): Promise<GroupMember> {
    const p = await getPool();
    const existing = await p.request()
      .input("groupId", sql.NVarChar(36), groupId)
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT * FROM group_members WHERE group_id = @groupId AND user_id = @userId");
    if (existing.recordset.length > 0) return mapGroupMember(existing.recordset[0]);
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("groupId", sql.NVarChar(36), groupId)
      .input("userId", sql.NVarChar(36), userId)
      .input("joinedAt", sql.DateTime2, now)
      .query("INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (@id, @groupId, @userId, @joinedAt)");
    return { id, groupId, userId, joinedAt: now };
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    const p = await getPool();
    await p.request()
      .input("groupId", sql.NVarChar(36), groupId)
      .input("userId", sql.NVarChar(36), userId)
      .query("DELETE FROM group_members WHERE group_id = @groupId AND user_id = @userId");
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const p = await getPool();
    const result = await p.request()
      .input("groupId", sql.NVarChar(36), groupId)
      .query("SELECT * FROM group_members WHERE group_id = @groupId");
    return result.recordset.map(mapGroupMember);
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const p = await getPool();
    const result = await p.request()
      .input("groupId", sql.NVarChar(36), groupId)
      .input("userId", sql.NVarChar(36), userId)
      .query("SELECT 1 AS found FROM group_members WHERE group_id = @groupId AND user_id = @userId");
    return result.recordset.length > 0;
  }

  async createGroupMessage(msg: InsertGroupMessage): Promise<GroupMessage> {
    const p = await getPool();
    const id = randomUUID();
    const now = new Date();
    await p.request()
      .input("id", sql.NVarChar(36), id)
      .input("groupId", sql.NVarChar(36), msg.groupId)
      .input("senderId", sql.NVarChar(36), msg.senderId)
      .input("content", sql.NVarChar(sql.MAX), msg.content ?? null)
      .input("fileUrl", sql.NVarChar(sql.MAX), msg.fileUrl ?? null)
      .input("fileName", sql.NVarChar(255), msg.fileName ?? null)
      .input("fileSize", sql.Int, msg.fileSize ?? null)
      .input("fileType", sql.NVarChar(100), msg.fileType ?? null)
      .input("createdAt", sql.DateTime2, now)
      .query(`INSERT INTO group_messages (id, group_id, sender_id, content, file_url, file_name, file_size, file_type, created_at)
              VALUES (@id, @groupId, @senderId, @content, @fileUrl, @fileName, @fileSize, @fileType, @createdAt)`);
    return { id, groupId: msg.groupId, senderId: msg.senderId, content: msg.content ?? null, fileUrl: msg.fileUrl ?? null, fileName: msg.fileName ?? null, fileSize: msg.fileSize ?? null, fileType: msg.fileType ?? null, createdAt: now };
  }

  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    const p = await getPool();
    const result = await p.request()
      .input("groupId", sql.NVarChar(36), groupId)
      .query("SELECT * FROM group_messages WHERE group_id = @groupId ORDER BY created_at ASC");
    return result.recordset.map(mapGroupMessage);
  }

  async deleteGroup(id: string): Promise<void> {
    const p = await getPool();
    await p.request().input("id", sql.NVarChar(36), id)
      .query("DELETE FROM group_messages WHERE group_id = @id");
    await p.request().input("id", sql.NVarChar(36), id)
      .query("DELETE FROM group_members WHERE group_id = @id");
    await p.request().input("id", sql.NVarChar(36), id)
      .query("DELETE FROM groups WHERE id = @id");
  }
}

export const storage = new DatabaseStorage();
