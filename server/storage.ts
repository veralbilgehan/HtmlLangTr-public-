import { 
  users, shifts, activities, messages, companies, activityTypes, salesRecords, companySettings,
  type User, type InsertUser,
  type Shift, type InsertShift,
  type Activity, type InsertActivity,
  type Message, type InsertMessage,
  type Company, type InsertCompany,
  type ActivityType, type InsertActivityType,
  type SalesRecord, type InsertSalesRecord,
  type CompanySettings, type InsertCompanySettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, isNull, inArray, gte } from "drizzle-orm";

export interface IStorage {
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  
  // Activity Types
  getActivityType(id: string): Promise<ActivityType | undefined>;
  getActivityTypesByCompany(companyId: string): Promise<ActivityType[]>;
  getDefaultActivityTypes(): Promise<ActivityType[]>;
  createActivityType(activityType: InsertActivityType): Promise<ActivityType>;
  updateActivityType(id: string, updates: Partial<ActivityType>): Promise<ActivityType | undefined>;
  
  // Shifts
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, updates: Partial<Shift>): Promise<Shift | undefined>;
  getActiveShift(userId: string): Promise<Shift | undefined>;
  getUserTodayShift(userId: string): Promise<Shift | undefined>;
  getUserShifts(userId: string): Promise<Shift[]>;
  getAllShifts(companyId: string | null): Promise<Shift[]>;
  
  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined>;
  getActiveActivity(userId: string): Promise<Activity | undefined>;
  getUserActivities(userId: string): Promise<Activity[]>;
  getAllActivities(companyId: string | null): Promise<Activity[]>;
  
  // Sales Records
  createSalesRecord(record: InsertSalesRecord): Promise<SalesRecord>;
  getUserSalesRecords(userId: string): Promise<SalesRecord[]>;
  getCompanySalesRecords(companyId: string): Promise<SalesRecord[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  getUserMessages(userId: string): Promise<Message[]>;
  getConversation(user1Id: string, user2Id: string): Promise<Message[]>;
  getRecentConversationPartnerIds(userId: string): Promise<string[]>;

  // Company Settings
  getCompanySettings(companyId: string): Promise<CompanySettings | undefined>;
  upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
}

export class DatabaseStorage implements IStorage {
  // Companies
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.name);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  // Activity Types
  async getActivityType(id: string): Promise<ActivityType | undefined> {
    const [activityType] = await db.select().from(activityTypes).where(eq(activityTypes.id, id));
    return activityType || undefined;
  }

  async getActivityTypesByCompany(companyId: string): Promise<ActivityType[]> {
    return await db
      .select()
      .from(activityTypes)
      .where(or(eq(activityTypes.companyId, companyId), eq(activityTypes.isDefault, true)))
      .orderBy(activityTypes.name);
  }

  async getDefaultActivityTypes(): Promise<ActivityType[]> {
    return await db
      .select()
      .from(activityTypes)
      .where(eq(activityTypes.isDefault, true))
      .orderBy(activityTypes.name);
  }

  async createActivityType(insertActivityType: InsertActivityType): Promise<ActivityType> {
    const [activityType] = await db.insert(activityTypes).values(insertActivityType).returning();
    return activityType;
  }

  async updateActivityType(id: string, updates: Partial<ActivityType>): Promise<ActivityType | undefined> {
    const [activityType] = await db
      .update(activityTypes)
      .set(updates)
      .where(eq(activityTypes.id, id))
      .returning();
    return activityType || undefined;
  }

  // Shifts
  async createShift(insertShift: InsertShift): Promise<Shift> {
    const [shift] = await db.insert(shifts).values(insertShift).returning();
    return shift;
  }

  async updateShift(id: string, updates: Partial<Shift>): Promise<Shift | undefined> {
    const [shift] = await db
      .update(shifts)
      .set(updates)
      .where(eq(shifts.id, id))
      .returning();
    return shift || undefined;
  }

  async getActiveShift(userId: string): Promise<Shift | undefined> {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.userId, userId), isNull(shifts.endTime)))
      .orderBy(desc(shifts.startTime))
      .limit(1);
    return shift || undefined;
  }

  async getUserTodayShift(userId: string): Promise<Shift | undefined> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [shift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.userId, userId), gte(shifts.startTime, startOfDay)))
      .orderBy(desc(shifts.startTime))
      .limit(1);
    return shift || undefined;
  }

  async getUserShifts(userId: string): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.startTime));
  }

  async getAllShifts(companyId: string | null): Promise<Shift[]> {
    if (companyId) {
      const companyUsers = await db.select({ id: users.id }).from(users).where(eq(users.companyId, companyId));
      const userIds = companyUsers.map(u => u.id);
      if (userIds.length === 0) return [];
      return await db
        .select()
        .from(shifts)
        .where(inArray(shifts.userId, userIds))
        .orderBy(desc(shifts.startTime));
    }
    return await db
      .select()
      .from(shifts)
      .orderBy(desc(shifts.startTime));
  }

  // Activities
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async getActiveActivity(userId: string): Promise<Activity | undefined> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(and(eq(activities.userId, userId), isNull(activities.endTime)))
      .orderBy(desc(activities.startTime))
      .limit(1);
    return activity || undefined;
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt));
  }

  async getAllActivities(companyId: string | null): Promise<Activity[]> {
    if (companyId) {
      const companyUsers = await db.select({ id: users.id }).from(users).where(eq(users.companyId, companyId));
      const userIds = companyUsers.map(u => u.id);
      if (userIds.length === 0) return [];
      return await db
        .select()
        .from(activities)
        .where(inArray(activities.userId, userIds))
        .orderBy(desc(activities.startTime));
    }
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.startTime));
  }

  // Sales Records
  async createSalesRecord(insertRecord: InsertSalesRecord): Promise<SalesRecord> {
    const [record] = await db.insert(salesRecords).values(insertRecord).returning();
    return record;
  }

  async getUserSalesRecords(userId: string): Promise<SalesRecord[]> {
    return await db
      .select()
      .from(salesRecords)
      .where(eq(salesRecords.userId, userId))
      .orderBy(desc(salesRecords.createdAt));
  }

  async getCompanySalesRecords(companyId: string): Promise<SalesRecord[]> {
    return await db
      .select()
      .from(salesRecords)
      .where(eq(salesRecords.companyId, companyId))
      .orderBy(desc(salesRecords.createdAt));
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ read: true }).where(eq(messages.id, id));
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.recipientId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.recipientId, user1Id))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getRecentConversationPartnerIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({
        senderId: messages.senderId,
        recipientId: messages.recipientId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
      .orderBy(desc(messages.createdAt));

    const seen = new Set<string>();
    const partnerIds: string[] = [];
    for (const row of rows) {
      const partnerId = row.senderId === userId ? row.recipientId : row.senderId;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        partnerIds.push(partnerId);
      }
    }
    return partnerIds;
  }

  // Company Settings
  async getCompanySettings(companyId: string): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId));
    return settings || undefined;
  }

  async upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings(settings.companyId);
    if (existing) {
      const [updated] = await db
        .update(companySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(companySettings.companyId, settings.companyId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(companySettings).values(settings).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
