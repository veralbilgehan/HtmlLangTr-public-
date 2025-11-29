import { 
  users, shifts, activities, messages,
  type User, type InsertUser,
  type Shift, type InsertShift,
  type Activity, type InsertActivity,
  type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Shifts
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, updates: Partial<Shift>): Promise<Shift | undefined>;
  getActiveShift(userId: string): Promise<Shift | undefined>;
  getUserShifts(userId: string): Promise<Shift[]>;
  
  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | undefined>;
  getActiveActivity(userId: string): Promise<Activity | undefined>;
  getUserActivities(userId: string): Promise<Activity[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  getUserMessages(userId: string): Promise<Message[]>;
  getConversation(user1Id: string, user2Id: string): Promise<Message[]>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
      .where(and(eq(shifts.userId, userId), eq(shifts.endTime, null)))
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
      .where(and(eq(activities.userId, userId), eq(activities.endTime, null)))
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
}

export const storage = new DatabaseStorage();
