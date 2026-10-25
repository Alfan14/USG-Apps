import { ZodError } from "zod";

/**
 * 404 Not Found Middleware
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  console.error("Unhandled Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid authentication token",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication token has expired",
    });
  }

  // Handle MySQL Duplicate Entry (ER_DUP_ENTRY: 1062)
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      error: "Conflict",
      message: "A record with this identifier already exists",
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? "Internal Server Error" : "Error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
