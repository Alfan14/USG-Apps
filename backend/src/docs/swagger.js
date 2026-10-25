import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "USG & Maternal Health API",
    version: "1.0.0",
    description:
      "Central backend service connecting hospital ultrasound recorders (edge laptop client) with patient mobile application (React Native Expo).",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      DeviceAuth: {
        type: "apiKey",
        in: "header",
        name: "X-Device-Key",
        description: "Examination room laptop recorder secret key",
      },
      PatientAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Patient JWT token issued upon login with No. RM and birth date",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Unauthorized" },
          message: { type: "string", example: "Invalid credentials" },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [
    "./src/modules/**/*.js",
    "./src/routes/**/*.js",
    "./src/app.js",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

/**
 * Mounts Swagger documentation at /api-docs and raw spec at /api-docs.json
 * @param {import("express").Application} app
 */
export function setupSwagger(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "USG & Maternal Health API Docs",
    })
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
