import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const pool = mysql.createPool(env.DATABASE_URL);
export const db = drizzle(pool, { schema, mode: "default" });

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection test error:", error.message);
    return false;
  }
}
