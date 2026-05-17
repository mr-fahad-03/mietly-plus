const mongoose = require("mongoose");

let cachedConnectionPromise = null;

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedConnectionPromise) {
    cachedConnectionPromise = mongoose
      .connect(mongoUri, {
        dbName: process.env.MONGODB_DB_NAME || "leihfluss",
      })
      .catch((error) => {
        cachedConnectionPromise = null;
        throw error;
      });
  }

  await cachedConnectionPromise;
  return mongoose.connection;
}

module.exports = { connectDatabase };
