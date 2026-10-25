import app from "../../app.js";

async function runTests() {
  console.log("🧪 Starting automated sanity checks...");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Test /health
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log("1. GET /health status:", healthRes.status, healthData);
    if (healthRes.status !== 200 || healthData.status !== "ok") {
      throw new Error("Health check failed");
    }

    // 2. Test /api-docs.json
    const docsRes = await fetch(`${baseUrl}/api-docs.json`);
    const docsData = await docsRes.json();
    console.log("2. GET /api-docs.json status:", docsRes.status, "Title:", docsData.info?.title);
    if (!docsData.openapi || docsData.info?.title !== "USG & Maternal Health API") {
      throw new Error("Swagger spec check failed");
    }

    // 3. Test Device Ingestion validation (No header)
    const ingestNoAuth = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const ingestNoAuthData = await ingestNoAuth.json();
    console.log("3. Ingest without auth status:", ingestNoAuth.status, ingestNoAuthData);
    if (ingestNoAuth.status !== 401) {
      throw new Error("Device auth missing check failed");
    }

    // 4. Test Device Ingestion validation (With header, invalid body)
    const ingestInvalidBody = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Key": "usg-recorder-secret-key-123",
      },
      body: JSON.stringify({}),
    });
    const ingestInvalidData = await ingestInvalidBody.json();
    console.log("4. Ingest with auth, empty body status:", ingestInvalidBody.status, ingestInvalidData);
    if (ingestInvalidBody.status !== 400 || ingestInvalidData.error !== "Validation Error") {
      throw new Error("Ingest Zod validation check failed");
    }

    // 5. Test Auth Login validation (Empty body)
    const loginEmpty = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const loginEmptyData = await loginEmpty.json();
    console.log("5. Auth login empty body status:", loginEmpty.status, loginEmptyData);
    if (loginEmpty.status !== 400 || loginEmptyData.error !== "Validation Error") {
      throw new Error("Login Zod validation check failed");
    }

    // 6. Test Protected route without JWT
    const protectedProfile = await fetch(`${baseUrl}/api/v1/patient/profile`);
    console.log("6. Protected /profile without token status:", protectedProfile.status);
    if (protectedProfile.status !== 401) {
      throw new Error("Patient auth missing check failed");
    }

    // 7. Test Protected notification routes without JWT
    const protectedNotifs = await fetch(`${baseUrl}/api/v1/patient/notifications`);
    console.log("7. Protected /notifications without token status:", protectedNotifs.status);
    if (protectedNotifs.status !== 401) {
      throw new Error("Notification auth missing check failed");
    }

    const protectedReadAll = await fetch(`${baseUrl}/api/v1/patient/notifications/read-all`, {
      method: "PATCH",
    });
    console.log("8. Protected /notifications/read-all without token status:", protectedReadAll.status);
    if (protectedReadAll.status !== 401) {
      throw new Error("Notification read-all auth missing check failed");
    }

    // 9. Verify Swagger paths contain all requested endpoints
    const paths = Object.keys(docsData.paths || {});
    const requiredPaths = [
      "/health",
      "/api/v1/recordings",
      "/api/v1/auth/login",
      "/api/v1/patient/profile",
      "/api/v1/patient/recordings",
      "/api/v1/patient/recordings/{id}",
      "/api/v1/patient/tips",
      "/api/v1/patient/tips/{id}",
      "/api/v1/patient/push-token",
      "/api/v1/patient/notifications",
      "/api/v1/patient/notifications/read-all",
      "/api/v1/patient/notifications/{id}/read",
    ];

    console.log("9. Verifying Swagger endpoints count:", paths.length);
    for (const reqPath of requiredPaths) {
      if (!paths.includes(reqPath)) {
        throw new Error(`Swagger missing path: ${reqPath}`);
      }
    }
    console.log("   All 12 expected API endpoints are present in Swagger documentation!");

    console.log("\n🎉 ALL SANITY TESTS PASSED SUCCESSFULLY!\n");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

