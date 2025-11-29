import { storage } from "./storage";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Create test users
    const existingEmployee = await storage.getUserByUsername("calisan1");
    if (!existingEmployee) {
      await storage.createUser({
        username: "calisan1",
        password: "123456",
        fullName: "Ahmet Yılmaz",
        role: "employee",
        department: "Satış",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet",
      });
      console.log("✓ Employee user created: calisan1");
    }

    const existingManager = await storage.getUserByUsername("yonetici1");
    if (!existingManager) {
      await storage.createUser({
        username: "yonetici1",
        password: "123456",
        fullName: "Ayşe Demir",
        role: "manager",
        department: "Yönetim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ayse",
      });
      console.log("✓ Manager user created: yonetici1");
    }

    const existingEmployee2 = await storage.getUserByUsername("calisan2");
    if (!existingEmployee2) {
      await storage.createUser({
        username: "calisan2",
        password: "123456",
        fullName: "Mehmet Kaya",
        role: "employee",
        department: "Operasyon",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mehmet",
      });
      console.log("✓ Employee user 2 created: calisan2");
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
