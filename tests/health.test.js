const request = require("supertest");
require("dotenv").config({ override: true });
const app = require("../src/app");
const connectDB = require("../src/config/database");
const mongoose = require("mongoose");

beforeAll(async () => { await connectDB(); });

test("GET /health -> 200", async () => {
  const res = await request(app).get("/health");
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ status: "ok" });
});

afterAll(async () => {
  await mongoose.connection.close(true);
});
