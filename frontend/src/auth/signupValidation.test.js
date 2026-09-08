import test from "node:test";
import assert from "node:assert/strict";
import { validateSignup, validateLogin } from "./signupValidation.js";
const valid = {
  fullName: " Test User ",
  email: " test@example.com ",
  password: "password123",
  confirmPassword: "password123",
  role: "institute-admin",
};
test("signup validates required fields, email, minimal password, confirmation and public roles", () => {
  assert.deepEqual(validateSignup(valid), {});
  assert.deepEqual(validateSignup({ ...valid, role: "student" }), {});
  for (const [field, value] of [
    ["fullName", "  "],
    ["email", ""],
    ["email", "bad@"],
    ["password", ""],
    ["password", "short"],
    ["confirmPassword", ""],
    ["confirmPassword", "different"],
    ["role", "teacher"],
  ])
    assert.ok(validateSignup({ ...valid, [field]: value })[field], field);
  assert.deepEqual(
    validateSignup({
      ...valid,
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
    }),
    {},
  );
});
test("login requires email and password without imposing a new password policy", () => {
  assert.deepEqual(
    validateLogin({ role: 'campus-admin', email: " test@example.com ", password: "short" }),
    {},
  );
  assert.ok(validateLogin({ role: 'campus-admin', email: "invalid", password: "valid" }).email);
  assert.deepEqual(Object.keys(validateLogin({ role: 'campus-admin', email: "", password: "" })), [
    "email",
    "password",
  ]);
});
