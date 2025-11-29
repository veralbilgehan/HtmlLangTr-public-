import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type User, insertUserSchema, insertShiftSchema, insertActivitySchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Desteklenmeyen dosya türü"));
    }
  },
});

// Configure Passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return done(null, false, { message: "Kullanıcı adı veya şifre hatalı" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(err);
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "turkish-company-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Yetkilendirme gerekli" });
    }
    next();
  };

  // WebSocket for chat - disabled for now to avoid conflicts with Vite HMR
  // Will be implemented separately or using HTTP polling

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Sunucu hatası" });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Giriş başarısız" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Giriş hatası" });
        }
        return res.json({ 
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            avatar: user.avatar,
          }
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Çıkış başarılı" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const user = req.user as User;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      }
    });
  });

  // Shift routes
  app.post("/api/shifts/start", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { latitude, longitude } = req.body;
      
      // Check if there's already an active shift
      const activeShift = await storage.getActiveShift(userId);
      if (activeShift) {
        return res.status(400).json({ message: "Zaten aktif bir vardiya var" });
      }

      const shift = await storage.createShift({
        userId,
        startTime: new Date(),
        endTime: null,
        durationSeconds: null,
        startLatitude: latitude || null,
        startLongitude: longitude || null,
        endLatitude: null,
        endLongitude: null,
      });

      res.json({ shift });
    } catch (error) {
      console.error("Shift start error:", error);
      res.status(500).json({ message: "Vardiya başlatma hatası" });
    }
  });

  app.post("/api/shifts/end", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { latitude, longitude } = req.body;
      
      const activeShift = await storage.getActiveShift(userId);
      if (!activeShift) {
        return res.status(400).json({ message: "Aktif vardiya bulunamadı" });
      }

      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - new Date(activeShift.startTime).getTime()) / 1000);

      const shift = await storage.updateShift(activeShift.id, {
        endTime,
        durationSeconds,
        endLatitude: latitude || null,
        endLongitude: longitude || null,
      });

      res.json({ shift });
    } catch (error) {
      console.error("Shift end error:", error);
      res.status(500).json({ message: "Vardiya bitirme hatası" });
    }
  });

  app.get("/api/shifts/active", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const shift = await storage.getActiveShift(userId);
      res.json({ shift: shift || null });
    } catch (error) {
      console.error("Get active shift error:", error);
      res.status(500).json({ message: "Vardiya bilgisi alınamadı" });
    }
  });

  app.get("/api/shifts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const shifts = await storage.getUserShifts(userId);
      res.json({ shifts });
    } catch (error) {
      console.error("Get shifts error:", error);
      res.status(500).json({ message: "Vardiyalar alınamadı" });
    }
  });

  // Activity routes
  app.post("/api/activities/start", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, shiftId } = req.body;

      // Check if there's already an active activity
      const activeActivity = await storage.getActiveActivity(userId);
      if (activeActivity) {
        return res.status(400).json({ message: "Zaten aktif bir aktivite var" });
      }

      const activity = await storage.createActivity({
        userId,
        shiftId: shiftId || null,
        type,
        startTime: new Date(),
        endTime: null,
        durationMinutes: null,
        notes: null,
      });

      res.json({ activity });
    } catch (error) {
      console.error("Activity start error:", error);
      res.status(500).json({ message: "Aktivite başlatma hatası" });
    }
  });

  app.post("/api/activities/end", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { notes } = req.body;
      
      const activeActivity = await storage.getActiveActivity(userId);
      if (!activeActivity) {
        return res.status(400).json({ message: "Aktif aktivite bulunamadı" });
      }

      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - new Date(activeActivity.startTime).getTime()) / 60000);

      const activity = await storage.updateActivity(activeActivity.id, {
        endTime,
        durationMinutes,
        notes: notes || null,
      });

      res.json({ activity });
    } catch (error) {
      console.error("Activity end error:", error);
      res.status(500).json({ message: "Aktivite bitirme hatası" });
    }
  });

  app.get("/api/activities/active", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activity = await storage.getActiveActivity(userId);
      res.json({ activity: activity || null });
    } catch (error) {
      console.error("Get active activity error:", error);
      res.status(500).json({ message: "Aktivite bilgisi alınamadı" });
    }
  });

  app.get("/api/activities", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activities = await storage.getUserActivities(userId);
      res.json({ activities });
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Aktiviteler alınamadı" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", requireAuth, (req: any, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Dosya bulunamadı" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", requireAuth, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Dosya yüklenmedi" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Dosya yüklenemedi" });
    }
  });

  // Message routes
  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { recipientId, content, fileUrl, fileName, fileSize, fileType } = req.body;

      const message = await storage.createMessage({
        senderId,
        recipientId,
        content: content || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileType: fileType || null,
      });

      res.json({ message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Mesaj gönderilemedi" });
    }
  });

  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getUserMessages(userId);
      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Mesajlar alınamadı" });
    }
  });

  app.get("/api/messages/:userId", requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;
      const messages = await storage.getConversation(currentUserId, otherUserId);
      res.json({ messages });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ message: "Konuşma alınamadı" });
    }
  });

  app.post("/api/messages/:id/read", requireAuth, async (req: any, res) => {
    try {
      const messageId = req.params.id;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({ message: "Mesaj güncellenemedi" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords
      const sanitizedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        department: u.department,
        avatar: u.avatar,
      }));
      res.json({ users: sanitizedUsers });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Kullanıcılar alınamadı" });
    }
  });

  return httpServer;
}
