const path = require("path");
const fs = require("fs");
const request = require("supertest");
require("dotenv").config({ override: true });
const app = require("../src/app");
const connectDB = require("../src/config/database");
const Team = require("../src/modules/teams/models/Team");
const mongoose = require("mongoose");

const UP_DIR = path.join(process.cwd(), "src", "public", "uploads_test");

beforeAll(async () => {
  await connectDB();
  if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });
});
beforeEach(async () => {
  await Team.deleteMany({});
  if (fs.existsSync(UP_DIR)) {
    for (const f of fs.readdirSync(UP_DIR)) fs.unlinkSync(path.join(UP_DIR, f));
  }
});

test("POST /api/teams crea equipo (201)", async () => {
  const res = await request(app)
    .post("/api/teams")
    .field("name", "Viszla Test")
    .attach("avatar", path.join(__dirname, "fixtures", "test.png"));
  expect(res.statusCode).toBe(201);
  expect(res.body?.team?.name).toBe("Viszla Test");
  expect(res.body?.team?.avatarUrl).toMatch(/^\/uploads\//);
});

test("POST /api/teams bloquea ofensivo (400)", async () => {
  const res = await request(app)
    .post("/api/teams")
    .field("name", "hp champions")
    .attach("avatar", path.join(__dirname, "fixtures", "test.png"));
  expect(res.statusCode).toBe(400);
});

test("POST /api/teams duplicado -> 409 y NO deja archivo nuevo", async () => {
  await request(app)
    .post("/api/teams")
    .field("name", "Duplicado")
    .attach("avatar", path.join(__dirname, "fixtures", "test.png"));

  const before = fs.readdirSync(UP_DIR).length;

  const res = await request(app)
    .post("/api/teams")
    .field("name", "duplicado") // mismo nombre con distinto case
    .attach("avatar", path.join(__dirname, "fixtures", "test.png"));

  const after = fs.readdirSync(UP_DIR).length;

  expect(res.statusCode).toBe(409);
  expect(after).toBe(before); // no aumentó → se limpió
});

test("POST sin avatar -> 400", async () => {
  const res = await request(app).post("/api/teams").field("name", "Sin Avatar");
  expect(res.statusCode).toBe(400);
});

test("POST tipo no permitido -> 400", async () => {
  const txtPath = path.join(__dirname, "fixtures", "dummy.txt");
  fs.writeFileSync(txtPath, "hola");
  const res = await request(app)
    .post("/api/teams")
    .field("name", "Tipo Invalido")
    .attach("avatar", txtPath); // text/plain => rechazado por fileFilter
  expect(res.statusCode).toBe(400);
  fs.unlinkSync(txtPath);
});

afterAll(async () => {
  await mongoose.connection.close(true);
});
