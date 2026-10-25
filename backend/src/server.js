import app from "./app.js";
import { env } from "./config/env.js";
import { testConnection } from "./db/index.js";

const server = app.listen(env.PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🏥 USG & Maternal Health Central Backend`);
  console.log(`📡 Server running on http://localhost:${env.PORT}`);
  console.log(`📖 Swagger API Docs at http://localhost:${env.PORT}/api-docs`);
  console.log(`🩺 Health check at http://localhost:${env.PORT}/health`);
  console.log(`======================================================\n`);

  const dbOk = await testConnection();
  if (dbOk) {
    console.log("🗄️ Database connected successfully.");
  } else {
    console.warn("⚠️ Warning: Could not connect to MySQL database at DATABASE_URL.");
    console.warn("   Make sure MySQL is running and the database exists.");
  }
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
