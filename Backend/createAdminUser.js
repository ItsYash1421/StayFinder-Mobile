import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import AdminUser from "./models/admin/User.js";
import dotenv from "dotenv";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Create admin user
    const adminUser = new AdminUser({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      avatar: "https://ui-avatars.com/api/?name=Admin+User&background=random"
    });

    await adminUser.save();
    console.log("Admin user created successfully");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

createAdminUser(); 