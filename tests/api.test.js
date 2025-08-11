import request from "supertest";
import express from "express";
import scenarioRouter from "../server/routes/scenario.js";
import schematicRouter from "../server/routes/schematic.js";
import proposalRouter from "../server/routes/proposal.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/scenario", scenarioRouter);
  app.use("/api/schematic", schematicRouter);
  app.use("/api/proposal", proposalRouter);
  return app;
}

const validScenario = {
  roomType: "Meeting Room",
  useCase: "USB Video Conferencing",
  numDisplays: 2,
  numSources: 2,
  maxCableDistanceMeters: 50,
  signalType: "HDMI"
};

describe("API", () => {
  test("/api/scenario/select returns selection", async () => {
    const app = createApp();
    const res = await request(app).post("/api/scenario/select").send(validScenario);
    expect(res.status).toBe(200);
    expect(res.body.bom.length).toBeGreaterThan(0);
  });

  test("/api/schematic/generate returns SVG", async () => {
    const app = createApp();
    const res = await request(app).post("/api/schematic/generate").send({ numDisplays: 2, numSources: 2 });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
    const text = Buffer.isBuffer(res.body) ? res.body.toString("utf-8") : (res.text || "");
    expect(text.includes("<svg")).toBe(true);
  });

  test("/api/proposal/compose returns HTML", async () => {
    const app = createApp();
    const resSel = await request(app).post("/api/schematic/generate").send({ numDisplays: 2, numSources: 2 });
    const res = await request(app).post("/api/proposal/compose").send({
      projectName: "Test Project",
      clientName: "Acme Corp",
      scenario: validScenario,
      schematicSvg: resSel.text
    });
    expect(res.status).toBe(200);
    expect(res.body.html.includes("<!doctype html>")).toBe(true);
  });
});