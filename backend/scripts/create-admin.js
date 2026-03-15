require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { connectDatabase } = require("../db");
const Admin = require("../models/Admin");

async function run() {
  const email = "asad@gmail.com";
  const password = "asad1122";
  const name = "Asad";

  await connectDatabase();

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await Admin.findOne({ email }).select("_id email");

  if (existing) {
    await Admin.updateOne({ _id: existing._id }, { $set: { name, passwordHash } });
    console.log(`Admin updated: ${email}`);
    return;
  }

  await Admin.create({ name, email, passwordHash });
  console.log(`Admin created: ${email}`);
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Admin script failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
