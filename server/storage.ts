import { randomUUID } from "crypto";
import { db } from "./db";
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
  Service, InsertService,
  SavedFile, InsertSavedFile,
} from "@shared/schema";

// ─── Row mappers (SQLite snake_case → TS camelCase) ───────────────────────────

function mapCompany(r: any): Company {
  return { id: r.id, name: r.name, address: r.address ?? null, phone: r.phone ?? null, email: r.email ?? null, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapUser(r: any): User {
  return { id: r.id, username: r.username, password: r.password, fullName: r.full_name, role: r.role, companyId: r.company_id ?? null, department: r.department ?? null, avatar: r.avatar ?? null };
}

function mapActivityType(r: any): ActivityType {
  return { id: r.id, companyId: r.company_id ?? null, name: r.name, category: r.category, points: r.points, isDefault: r.is_default === 1, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapShift(r: any): Shift {
  return { id: r.id, userId: r.user_id, companyId: r.company_id ?? null, startTime: new Date(r.start_time), endTime: r.end_time ? new Date(r.end_time) : null, durationSeconds: r.duration_seconds ?? null, startLatitude: r.start_latitude ?? null, startLongitude: r.start_longitude ?? null, endLatitude: r.end_latitude ?? null, endLongitude: r.end_longitude ?? null, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapActivity(r: any): Activity {
  return { id: r.id, userId: r.user_id, companyId: r.company_id ?? null, shiftId: r.shift_id ?? null, activityTypeId: r.activity_type_id ?? null, type: r.type, startTime: new Date(r.start_time), endTime: r.end_time ? new Date(r.end_time) : null, durationMinutes: r.duration_minutes ?? null, notes: r.notes ?? null, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapSalesRecord(r: any): SalesRecord {
  return { id: r.id, userId: r.user_id, companyId: r.company_id ?? null, shiftId: r.shift_id ?? null, activityTypeId: r.activity_type_id ?? null, type: r.type, quantity: r.quantity ?? null, notes: r.notes ?? null, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapMessage(r: any): Message {
  return { id: r.id, senderId: r.sender_id, recipientId: r.recipient_id, companyId: r.company_id ?? null, content: r.content ?? null, fileUrl: r.file_url ?? null, fileName: r.file_name ?? null, fileSize: r.file_size ?? null, fileType: r.file_type ?? null, read: r.read === 1, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapCompanySettings(r: any): CompanySettings {
  return { id: r.id, companyId: r.company_id, shiftStartTime: r.shift_start_time, shiftEndTime: r.shift_end_time, lateThresholdMinutes: r.late_threshold_minutes, lateWarning1: r.late_warning1, lateWarning2: r.late_warning2, lateWarning3: r.late_warning3, updatedAt: r.updated_at ? new Date(r.updated_at) : null };
}

function mapGroup(r: any): Group {
  return { id: r.id, name: r.name, companyId: r.company_id ?? null, createdBy: r.created_by ?? null, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapGroupMember(r: any): GroupMember {
  return { id: r.id, groupId: r.group_id, userId: r.user_id, joinedAt: r.joined_at ? new Date(r.joined_at) : null };
}

function mapGroupMessage(r: any): GroupMessage {
  return { id: r.id, groupId: r.group_id, senderId: r.sender_id, content: r.content ?? null, fileUrl: r.file_url ?? null, fileName: r.file_name ?? null, fileSize: r.file_size ?? null, fileType: r.file_type ?? null, createdAt: r.created_at ? new Date(r.created_at) : null };
}

function mapService(r: any): Service {
  return {
    id: r.id,
    userId: r.user_id,
    companyId: r.company_id ?? null,
    serviceName: r.service_name,
    plate: r.plate,
    startTime: new Date(r.start_time),
    estimatedDurationMinutes: r.estimated_duration_minutes,
    endTime: r.end_time ? new Date(r.end_time) : null,
    actualDurationMinutes: r.actual_duration_minutes ?? null,
    differenceMinutes: r.difference_minutes ?? null,
    fileUrl: r.file_url ?? null,
    fileName: r.file_name ?? null,
    fileSize: r.file_size ?? null,
    fileType: r.file_type ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null
  };
}

function mapSavedFile(r: any): SavedFile {
  return {
    id: r.id,
    companyId: r.company_id ?? null,
    fileName: r.file_name,
    filePath: r.file_path,
    fileType: r.file_type,
    fileSize: r.file_size ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
    createdBy: r.created_by ?? null,
  };
}

// ─── IStorage interface ───────────────────────────────────────────────────────

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
  deleteActivityType(id: string): Promise<void>;

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

  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<Service>): Promise<Service | undefined>;
  getActiveService(userId: string): Promise<Service | undefined>;
  getUserServices(userId: string): Promise<Service[]>;
  getAllServices(companyId: string | null): Promise<Service[]>;

  getSavedFilesByCompany(companyId: string): Promise<SavedFile[]>;
  createSavedFile(file: InsertSavedFile): Promise<SavedFile>;
  deleteSavedFile(id: string): Promise<void>;
  getSavedFile(id: string): Promise<SavedFile | undefined>;
}

// ─── DatabaseStorage (SQLite) ─────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // ── Companies ──────────────────────────────────────────────────────────────
  async getCompany(id: string): Promise<Company | undefined> {
    const r = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as any;
    return r ? mapCompany(r) : undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    return (db.prepare("SELECT * FROM companies ORDER BY name").all() as any[]).map(mapCompany);
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const id = randomUUID();
    db.prepare("INSERT INTO companies (id, name, address, phone, email) VALUES (?, ?, ?, ?, ?)").run(id, data.name, data.address ?? null, data.phone ?? null, data.email ?? null);
    return (await this.getCompany(id))!;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const fields: string[] = [];
    const vals: any[] = [];
    if (updates.name !== undefined) { fields.push("name = ?"); vals.push(updates.name); }
    if (updates.address !== undefined) { fields.push("address = ?"); vals.push(updates.address); }
    if (updates.phone !== undefined) { fields.push("phone = ?"); vals.push(updates.phone); }
    if (updates.email !== undefined) { fields.push("email = ?"); vals.push(updates.email); }
    if (fields.length) { vals.push(id); db.prepare(`UPDATE companies SET ${fields.join(", ")} WHERE id = ?`).run(...vals); }
    return this.getCompany(id);
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUser(id: string): Promise<User | undefined> {
    const r = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    return r ? mapUser(r) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const r = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    return r ? mapUser(r) : undefined;
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    db.prepare("INSERT INTO users (id, username, password, full_name, role, company_id, department, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.username, data.password, data.fullName, data.role ?? "employee", data.companyId ?? null, data.department ?? null, data.avatar ?? null);
    return (await this.getUser(id))!;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const fields: string[] = [];
    const vals: any[] = [];
    if (updates.username !== undefined) { fields.push("username = ?"); vals.push(updates.username); }
    if (updates.password !== undefined) { fields.push("password = ?"); vals.push(updates.password); }
    if (updates.fullName !== undefined) { fields.push("full_name = ?"); vals.push(updates.fullName); }
    if (updates.role !== undefined) { fields.push("role = ?"); vals.push(updates.role); }
    if (updates.companyId !== undefined) { fields.push("company_id = ?"); vals.push(updates.companyId); }
    if (updates.department !== undefined) { fields.push("department = ?"); vals.push(updates.department); }
    if (updates.avatar !== undefined) { fields.push("avatar = ?"); vals.push(updates.avatar); }
    if (fields.length) { vals.push(id); db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...vals); }
    return this.getUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    return (db.prepare("SELECT * FROM users").all() as any[]).map(mapUser);
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return (db.prepare("SELECT * FROM users WHERE company_id = ?").all(companyId) as any[]).map(mapUser);
  }

  async getCompanyUsers(companyId: string): Promise<User[]> {
    return this.getUsersByCompany(companyId);
  }

  // ── Activity Types ─────────────────────────────────────────────────────────
  async getActivityType(id: string): Promise<ActivityType | undefined> {
    const r = db.prepare("SELECT * FROM activity_types WHERE id = ?").get(id) as any;
    return r ? mapActivityType(r) : undefined;
  }

  async getActivityTypesByCompany(companyId: string): Promise<ActivityType[]> {
    return (db.prepare("SELECT * FROM activity_types WHERE company_id = ? OR is_default = 1 ORDER BY name").all(companyId) as any[]).map(mapActivityType);
  }

  async getDefaultActivityTypes(): Promise<ActivityType[]> {
    return (db.prepare("SELECT * FROM activity_types WHERE is_default = 1 ORDER BY name").all() as any[]).map(mapActivityType);
  }

  async createActivityType(data: InsertActivityType): Promise<ActivityType> {
    const id = randomUUID();
    db.prepare("INSERT INTO activity_types (id, company_id, name, category, points, is_default) VALUES (?, ?, ?, ?, ?, ?)").run(id, data.companyId ?? null, data.name, data.category ?? "activity", data.points ?? 1, data.isDefault ? 1 : 0);
    return (await this.getActivityType(id))!;
  }

  async updateActivityType(id: string, updates: Partial<ActivityType>): Promise<ActivityType | undefined> {
    const fields: string[] = [];
    const vals: any[] = [];
    if (updates.name !== undefined) { fields.push("name = ?"); vals.push(updates.name); }
    if (updates.category !== undefined) { fields.push("category = ?"); vals.push(updates.category); }
    if (updates.points !== undefined) { fields.push("points = ?"); vals.push(updates.points); }
    if (updates.isDefault !== undefined) { fields.push("is_default = ?"); vals.push(updates.isDefault ? 1 : 0); }
    if (fields.length) { vals.push(id); db.prepare(`UPDATE activity_types SET ${fields.join(", ")} WHERE id = ?`).run(...vals); }
    return this.getActivityType(id);
  }

  async deleteActivityType(id: string): Promise<void> {
    db.prepare("DELETE FROM activity_types WHERE id = ?").run(id);
  }

  // ── Shifts ─────────────────────────────────────────────────────────────────
  async createShift(data: InsertShift): Promise<Shift> {
    const id = randomUUID();
    db.prepare("INSERT INTO shifts (id, user_id, company_id, start_time, end_time, duration_seconds, start_latitude, start_longitude, end_latitude, end_longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.userId, data.companyId ?? null, data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime, data.endTime ? (data.endTime instanceof Date ? data.endTime.toISOString() : data.endTime) : null, data.durationSeconds ?? null, data.startLatitude ?? null, data.startLongitude ?? null, data.endLatitude ?? null, data.endLongitude ?? null);
    return (await this.getShiftById(id))!;
  }

  async updateShift(id: string, updates: Partial<Shift>): Promise<Shift | undefined> {
    const fields: string[] = [];
    const vals: any[] = [];
    if (updates.endTime !== undefined) { fields.push("end_time = ?"); vals.push(updates.endTime ? (updates.endTime instanceof Date ? updates.endTime.toISOString() : updates.endTime) : null); }
    if (updates.durationSeconds !== undefined) { fields.push("duration_seconds = ?"); vals.push(updates.durationSeconds); }
    if (updates.endLatitude !== undefined) { fields.push("end_latitude = ?"); vals.push(updates.endLatitude); }
    if (updates.endLongitude !== undefined) { fields.push("end_longitude = ?"); vals.push(updates.endLongitude); }
    if (fields.length) { vals.push(id); db.prepare(`UPDATE shifts SET ${fields.join(", ")} WHERE id = ?`).run(...vals); }
    return this.getShiftById(id);
  }

  private async getShiftById(id: string): Promise<Shift | undefined> {
    const r = db.prepare("SELECT * FROM shifts WHERE id = ?").get(id) as any;
    return r ? mapShift(r) : undefined;
  }

  async getActiveShift(userId: string): Promise<Shift | undefined> {
    const r = db.prepare("SELECT * FROM shifts WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1").get(userId) as any;
    return r ? mapShift(r) : undefined;
  }

  async getUserTodayShift(userId: string): Promise<Shift | undefined> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const r = db.prepare("SELECT * FROM shifts WHERE user_id = ? AND start_time >= ? ORDER BY start_time DESC LIMIT 1").get(userId, today.toISOString()) as any;
    return r ? mapShift(r) : undefined;
  }

  async getUserShifts(userId: string): Promise<Shift[]> {
    return (db.prepare("SELECT * FROM shifts WHERE user_id = ? ORDER BY start_time DESC").all(userId) as any[]).map(mapShift);
  }

  async getAllShifts(companyId: string | null): Promise<Shift[]> {
    if (companyId) {
      return (db.prepare("SELECT s.* FROM shifts s INNER JOIN users u ON s.user_id = u.id WHERE u.company_id = ? ORDER BY s.start_time DESC").all(companyId) as any[]).map(mapShift);
    }
    return (db.prepare("SELECT * FROM shifts ORDER BY start_time DESC").all() as any[]).map(mapShift);
  }

  // ── Activities ─────────────────────────────────────────────────────────────
  async createActivity(data: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    db.prepare("INSERT INTO activities (id, user_id, company_id, shift_id, activity_type_id, type, start_time, end_time, duration_minutes, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.userId, data.companyId ?? null, data.shiftId ?? null, data.activityTypeId ?? null, data.type, data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime, data.endTime ? (data.endTime instanceof Date ? data.endTime.toISOString() : data.endTime) : null, data.durationMinutes ?? null, data.notes ?? null);
    return (await this.getActivityById(id))!;
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined> {
    const fields: string[] = [];
    const vals: any[] = [];
    if (updates.endTime !== undefined) { fields.push("end_time = ?"); vals.push(updates.endTime ? (updates.endTime instanceof Date ? updates.endTime.toISOString() : updates.endTime) : null); }
    if (updates.durationMinutes !== undefined) { fields.push("duration_minutes = ?"); vals.push(updates.durationMinutes); }
    if (updates.notes !== undefined) { fields.push("notes = ?"); vals.push(updates.notes); }
    if (updates.type !== undefined) { fields.push("type = ?"); vals.push(updates.type); }
    if (fields.length) { vals.push(id); db.prepare(`UPDATE activities SET ${fields.join(", ")} WHERE id = ?`).run(...vals); }
    return this.getActivityById(id);
  }

  private async getActivityById(id: string): Promise<Activity | undefined> {
    const r = db.prepare("SELECT * FROM activities WHERE id = ?").get(id) as any;
    return r ? mapActivity(r) : undefined;
  }

  async getActiveActivity(userId: string): Promise<Activity | undefined> {
    const r = db.prepare("SELECT * FROM activities WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1").get(userId) as any;
    return r ? mapActivity(r) : undefined;
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return (db.prepare("SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[]).map(mapActivity);
  }

  async getAllActivities(companyId: string | null): Promise<Activity[]> {
    if (companyId) {
      return (db.prepare("SELECT a.* FROM activities a INNER JOIN users u ON a.user_id = u.id WHERE u.company_id = ? ORDER BY a.start_time DESC").all(companyId) as any[]).map(mapActivity);
    }
    return (db.prepare("SELECT * FROM activities ORDER BY start_time DESC").all() as any[]).map(mapActivity);
  }

  // ── Sales Records ──────────────────────────────────────────────────────────
  async createSalesRecord(data: InsertSalesRecord): Promise<SalesRecord> {
    const id = randomUUID();
    db.prepare("INSERT INTO sales_records (id, user_id, company_id, shift_id, activity_type_id, type, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.userId, data.companyId ?? null, data.shiftId ?? null, data.activityTypeId ?? null, data.type, data.quantity ?? 1, data.notes ?? null);
    const r = db.prepare("SELECT * FROM sales_records WHERE id = ?").get(id) as any;
    return mapSalesRecord(r);
  }

  async getUserSalesRecords(userId: string): Promise<SalesRecord[]> {
    return (db.prepare("SELECT * FROM sales_records WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[]).map(mapSalesRecord);
  }

  async getCompanySalesRecords(companyId: string): Promise<SalesRecord[]> {
    return (db.prepare("SELECT * FROM sales_records WHERE company_id = ? ORDER BY created_at DESC").all(companyId) as any[]).map(mapSalesRecord);
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  async createMessage(data: InsertMessage): Promise<Message> {
    const id = randomUUID();
    db.prepare("INSERT INTO messages (id, sender_id, recipient_id, company_id, content, file_url, file_name, file_size, file_type, read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)").run(id, data.senderId, data.recipientId, data.companyId ?? null, data.content ?? null, data.fileUrl ?? null, data.fileName ?? null, data.fileSize ?? null, data.fileType ?? null);
    const r = db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as any;
    return mapMessage(r);
  }

  async markMessageAsRead(id: string): Promise<void> {
    db.prepare("UPDATE messages SET read = 1 WHERE id = ?").run(id);
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return (db.prepare("SELECT * FROM messages WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at DESC").all(userId, userId) as any[]).map(mapMessage);
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    return (db.prepare("SELECT * FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?) ORDER BY created_at ASC").all(user1Id, user2Id, user2Id, user1Id) as any[]).map(mapMessage);
  }

  async getRecentConversationPartnerIds(userId: string): Promise<string[]> {
    const rows = db.prepare("SELECT sender_id, recipient_id FROM messages WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at DESC").all(userId, userId) as any[];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const row of rows) {
      const partnerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
      if (!seen.has(partnerId)) { seen.add(partnerId); ids.push(partnerId); }
    }
    return ids;
  }

  // ── Company Settings ───────────────────────────────────────────────────────
  async getCompanySettings(companyId: string): Promise<CompanySettings | undefined> {
    const r = db.prepare("SELECT * FROM company_settings WHERE company_id = ?").get(companyId) as any;
    return r ? mapCompanySettings(r) : undefined;
  }

  async upsertCompanySettings(data: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings(data.companyId);
    if (existing) {
      db.prepare("UPDATE company_settings SET shift_start_time=?, shift_end_time=?, late_threshold_minutes=?, late_warning1=?, late_warning2=?, late_warning3=?, updated_at=datetime('now') WHERE company_id=?").run(data.shiftStartTime, data.shiftEndTime, data.lateThresholdMinutes, data.lateWarning1, data.lateWarning2, data.lateWarning3, data.companyId);
    } else {
      const id = randomUUID();
      db.prepare("INSERT INTO company_settings (id, company_id, shift_start_time, shift_end_time, late_threshold_minutes, late_warning1, late_warning2, late_warning3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.companyId, data.shiftStartTime, data.shiftEndTime, data.lateThresholdMinutes, data.lateWarning1, data.lateWarning2, data.lateWarning3);
    }
    return (await this.getCompanySettings(data.companyId))!;
  }

  // ── Groups ─────────────────────────────────────────────────────────────────
  async createGroup(data: InsertGroup): Promise<Group> {
    const id = randomUUID();
    db.prepare("INSERT INTO groups (id, name, company_id, created_by) VALUES (?, ?, ?, ?)").run(id, data.name, data.companyId ?? null, data.createdBy ?? null);
    return (await this.getGroup(id))!;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const r = db.prepare("SELECT * FROM groups WHERE id = ?").get(id) as any;
    return r ? mapGroup(r) : undefined;
  }

  async getGroupsByCompany(companyId: string): Promise<Group[]> {
    return (db.prepare("SELECT * FROM groups WHERE company_id = ? ORDER BY name").all(companyId) as any[]).map(mapGroup);
  }

  async getGroupsByUser(userId: string): Promise<Group[]> {
    return (db.prepare("SELECT g.* FROM groups g INNER JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ? ORDER BY g.name").all(userId) as any[]).map(mapGroup);
  }

  async addGroupMember(groupId: string, userId: string): Promise<GroupMember> {
    const existing = db.prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userId) as any;
    if (existing) return mapGroupMember(existing);
    const id = randomUUID();
    db.prepare("INSERT INTO group_members (id, group_id, user_id) VALUES (?, ?, ?)").run(id, groupId, userId);
    return mapGroupMember(db.prepare("SELECT * FROM group_members WHERE id = ?").get(id));
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    db.prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?").run(groupId, userId);
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return (db.prepare("SELECT * FROM group_members WHERE group_id = ?").all(groupId) as any[]).map(mapGroupMember);
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const r = db.prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?").get(groupId, userId);
    return !!r;
  }

  async createGroupMessage(data: InsertGroupMessage): Promise<GroupMessage> {
    const id = randomUUID();
    db.prepare("INSERT INTO group_messages (id, group_id, sender_id, content, file_url, file_name, file_size, file_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.groupId, data.senderId, data.content ?? null, data.fileUrl ?? null, data.fileName ?? null, data.fileSize ?? null, data.fileType ?? null);
    return mapGroupMessage(db.prepare("SELECT * FROM group_messages WHERE id = ?").get(id));
  }

  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    return (db.prepare("SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at ASC").all(groupId) as any[]).map(mapGroupMessage);
  }

  async deleteGroup(id: string): Promise<void> {
    db.prepare("DELETE FROM group_messages WHERE group_id = ?").run(id);
    db.prepare("DELETE FROM group_members WHERE group_id = ?").run(id);
    db.prepare("DELETE FROM groups WHERE id = ?").run(id);
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const r = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as any;
    return r ? mapService(r) : undefined;
  }

  async createService(data: InsertService): Promise<Service> {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO services (
        id, user_id, company_id, service_name, plate, start_time, estimated_duration_minutes,
        file_url, file_name, file_size, file_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.companyId ?? null,
      data.serviceName,
      data.plate,
      data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime,
      data.estimatedDurationMinutes,
      data.fileUrl ?? null,
      data.fileName ?? null,
      data.fileSize ?? null,
      data.fileType ?? null
    );
    return (await this.getServiceById(id))!;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    const fields: string[] = [];
    const vals: any[] = [];
    if (updates.endTime !== undefined) { fields.push("end_time = ?"); vals.push(updates.endTime ? (updates.endTime instanceof Date ? updates.endTime.toISOString() : updates.endTime) : null); }
    if (updates.actualDurationMinutes !== undefined) { fields.push("actual_duration_minutes = ?"); vals.push(updates.actualDurationMinutes); }
    if (updates.differenceMinutes !== undefined) { fields.push("difference_minutes = ?"); vals.push(updates.differenceMinutes); }
    if (fields.length) {
      vals.push(id);
      db.prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`).run(...vals);
    }
    return this.getServiceById(id);
  }

  async getActiveService(userId: string): Promise<Service | undefined> {
    const r = db.prepare("SELECT * FROM services WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1").get(userId) as any;
    return r ? mapService(r) : undefined;
  }

  async getUserServices(userId: string): Promise<Service[]> {
    return (db.prepare("SELECT * FROM services WHERE user_id = ? ORDER BY start_time DESC").all(userId) as any[]).map(mapService);
  }

  async getAllServices(companyId: string | null): Promise<Service[]> {
    if (companyId) {
      return (db.prepare("SELECT * FROM services WHERE company_id = ? ORDER BY start_time DESC").all(companyId) as any[]).map(mapService);
    }
    return (db.prepare("SELECT * FROM services ORDER BY start_time DESC").all() as any[]).map(mapService);
  }

  // ── Saved Files ─────────────────────────────────────────────────────────────
  async getSavedFilesByCompany(companyId: string): Promise<SavedFile[]> {
    return (db.prepare("SELECT * FROM saved_files WHERE company_id = ? ORDER BY created_at DESC").all(companyId) as any[]).map(mapSavedFile);
  }

  async getSavedFile(id: string): Promise<SavedFile | undefined> {
    const r = db.prepare("SELECT * FROM saved_files WHERE id = ?").get(id) as any;
    return r ? mapSavedFile(r) : undefined;
  }

  async createSavedFile(data: InsertSavedFile): Promise<SavedFile> {
    const id = randomUUID();
    db.prepare("INSERT INTO saved_files (id, company_id, file_name, file_path, file_type, file_size, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, data.companyId ?? null, data.fileName, data.filePath, data.fileType, data.fileSize ?? null, data.createdBy ?? null);
    return (await this.getSavedFile(id))!;
  }

  async deleteSavedFile(id: string): Promise<void> {
    db.prepare("DELETE FROM saved_files WHERE id = ?").run(id);
  }
}

export const storage = new DatabaseStorage();
