import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import AdminUser from "./models/admin/User.js";

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🗃️ Connected to DB");

    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ email: "admin@stayfinder.com" });
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      process.exit(0);
    }

    // Create hashed password
    const password = await bcrypt.hash("Admin123!", 10);

    // Create admin user
    const adminUser = new AdminUser({
      name: "Admin User",
      email: "admin@stayfinder.com",
      password: password,
      role: "admin",
      avatar: "https://ui-avatars.com/api/?name=Admin+User",
      isVerified: true,
      joinDate: new Date(),
      createdAt: new Date(),
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully");
    console.log("Email: admin@stayfinder.com");
    console.log("Password: Admin123!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser(); 