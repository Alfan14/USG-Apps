import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidRm,
  normalizeRm,
  normalizeName,
  namesMatch,
  safeEqualHex,
  hashDeviceId,
  hashToken,
  generateRefreshToken,
  DEVICE_ID_REGEX,
} from "../../utils/security.js";

test("RM harus berformat RM-angka", () => {
  assert.equal(normalizeRm("  rm-20418 "), "RM-20418");
  assert.ok(isValidRm("RM-20418"));
  assert.ok(isValidRm("RM-123456789012"));
  assert.ok(!isValidRm("20418"));
  assert.ok(!isValidRm("RM20418"));
  assert.ok(!isValidRm("RM-12"));
  assert.ok(!isValidRm("RM-ABC123"));
  assert.ok(!isValidRm("RM-1234567890123"));
  assert.ok(!isValidRm("RM-1234; DROP TABLE"));
});

test("normalisasi & pencocokan nama", () => {
  assert.equal(normalizeName("  Siti   RAHMA "), "siti rahma");
  assert.equal(normalizeName("Sití Rahmá"), "siti rahma");
  assert.ok(namesMatch("siti rahma", "Siti Rahma"));
  assert.ok(namesMatch("  SITI  RAHMA ", "Siti Rahma"));
  assert.ok(!namesMatch("Siti", "Siti Rahma"));
  assert.ok(!namesMatch("Dewi Lestari", "Siti Rahma"));
  assert.ok(!namesMatch("", ""));
  assert.ok(!namesMatch("123", "456")); // kosong setelah normalisasi
});

test("safeEqualHex", () => {
  assert.ok(safeEqualHex("ab12", "ab12"));
  assert.ok(!safeEqualHex("ab12", "ab13"));
  assert.ok(!safeEqualHex("ab12", "ab1234"));
  assert.ok(!safeEqualHex(null, "ab12"));
  assert.ok(!safeEqualHex("ab12", undefined));
  assert.ok(!safeEqualHex("", ""));
});

test("hash perangkat: deterministik, bergantung secret, bukan ID mentah", () => {
  const id = "3f2c9a10-5b7e-4c1d-9a55-0e1f2a3b4c5d";
  const a = hashDeviceId(id, "secret-A");
  assert.equal(a, hashDeviceId(id, "secret-A"));
  assert.notEqual(a, hashDeviceId(id, "secret-B"));
  assert.notEqual(a, hashDeviceId(id + "x", "secret-A"));
  assert.equal(a.length, 64);
  assert.ok(!a.includes(id));
});

test("format X-Device-Id", () => {
  assert.ok(DEVICE_ID_REGEX.test("3f2c9a10-5b7e-4c1d-9a55-0e1f2a3b4c5d"));
  assert.ok(!DEVICE_ID_REGEX.test("short"));
  assert.ok(!DEVICE_ID_REGEX.test("bad id with spaces !!!!!!!!!!!"));
});

test("refresh token acak & hash tidak sama dengan token", () => {
  const t1 = generateRefreshToken();
  const t2 = generateRefreshToken();
  assert.notEqual(t1, t2);
  assert.ok(t1.length >= 60);
  assert.notEqual(hashToken(t1), t1);
  assert.equal(hashToken(t1), hashToken(t1));
  assert.equal(hashToken(t1).length, 64);
});