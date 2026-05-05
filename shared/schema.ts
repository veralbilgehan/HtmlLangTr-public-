import { z } from "zod";

// ─── Companies ───────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date | null;
}

export const insertCompanySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: string;
  companyId: string | null;
  department: string | null;
  avatar: string | null;
}

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  fullName: z.string().min(1),
  role: z.string().default("employee"),
  companyId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// ─── Activity Types ───────────────────────────────────────────────────────────
export interface ActivityType {
  id: string;
  companyId: string | null;
  name: string;
  category: string;
  points: number;
  isDefault: boolean | null;
  createdAt: Date | null;
}

export const insertActivityTypeSchema = z.object({
  companyId: z.string().optional().nullable(),
  name: z.string().min(1),
  category: z.string().default("activity"),
  points: z.number().int().default(1),
  isDefault: z.boolean().optional().nullable(),
});
export type InsertActivityType = z.infer<typeof insertActivityTypeSchema>;

// ─── Shifts ───────────────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  userId: string;
  companyId: string | null;
  startTime: Date;
  endTime: Date | null;
  durationSeconds: number | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  createdAt: Date | null;
}

export const insertShiftSchema = z.object({
  userId: z.string(),
  companyId: z.string().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  durationSeconds: z.number().int().optional().nullable(),
  startLatitude: z.number().optional().nullable(),
  startLongitude: z.number().optional().nullable(),
  endLatitude: z.number().optional().nullable(),
  endLongitude: z.number().optional().nullable(),
});
export type InsertShift = z.infer<typeof insertShiftSchema>;

// ─── Activities ───────────────────────────────────────────────────────────────
export interface Activity {
  id: string;
  userId: string;
  companyId: string | null;
  shiftId: string | null;
  activityTypeId: string | null;
  type: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date | null;
}

export const insertActivitySchema = z.object({
  userId: z.string(),
  companyId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  activityTypeId: z.string().optional().nullable(),
  type: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  durationMinutes: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// ─── Sales Records ────────────────────────────────────────────────────────────
export interface SalesRecord {
  id: string;
  userId: string;
  companyId: string | null;
  shiftId: string | null;
  activityTypeId: string | null;
  type: string;
  quantity: number | null;
  notes: string | null;
  createdAt: Date | null;
}

export const insertSalesRecordSchema = z.object({
  userId: z.string(),
  companyId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  activityTypeId: z.string().optional().nullable(),
  type: z.string().min(1),
  quantity: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type InsertSalesRecord = z.infer<typeof insertSalesRecordSchema>;

// ─── Company Settings ─────────────────────────────────────────────────────────
export interface CompanySettings {
  id: string;
  companyId: string;
  shiftStartTime: string;
  shiftEndTime: string;
  lateThresholdMinutes: number;
  lateWarning1: string;
  lateWarning2: string;
  lateWarning3: string;
  updatedAt: Date | null;
}

export const insertCompanySettingsSchema = z.object({
  companyId: z.string(),
  shiftStartTime: z.string().default("09:00"),
  shiftEndTime: z.string().default("18:00"),
  lateThresholdMinutes: z.number().int().default(15),
  lateWarning1: z.string().default("Mesai saatinde işyerinde olmadığınızdan kanuna ilişkin mazeretinizi bildiriniz."),
  lateWarning2: z.string().default("Mesai başlangıç saatini geçmenize rağmen mesainizi başlatmadınız. Lütfen durumu yöneticinize bildirin."),
  lateWarning3: z.string().default("Devamsızlık tutanağı düzenlenecektir. En kısa sürede işyerinizde bulununuz."),
});
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

// ─── Groups ───────────────────────────────────────────────────────────────────
export interface Group {
  id: string;
  name: string;
  companyId: string | null;
  createdBy: string | null;
  createdAt: Date | null;
}

export const insertGroupSchema = z.object({
  name: z.string().min(1),
  companyId: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;

// ─── Group Members ────────────────────────────────────────────────────────────
export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: Date | null;
}

// ─── Group Messages ───────────────────────────────────────────────────────────
export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  createdAt: Date | null;
}

export const insertGroupMessageSchema = z.object({
  groupId: z.string(),
  senderId: z.string(),
  content: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  fileType: z.string().optional().nullable(),
});
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;

// ─── Messages ─────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  companyId: string | null;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  read: boolean | null;
  createdAt: Date | null;
}

export const insertMessageSchema = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  companyId: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  fileType: z.string().optional().nullable(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
