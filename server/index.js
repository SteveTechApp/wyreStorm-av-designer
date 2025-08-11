import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import scenarioRouter from "./routes/scenario.js";
import schematicRouter from "./routes/schematic.js";
import proposalRouter from "./routes/proposal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "2mb" }));

// Static files from workspace root
const publicDir = path.resolve(__dirname, "..", "..");
app.use(express.static(publicDir));

app.use("/api/scenario", scenarioRouter);
app.use("/api/schematic", schematicRouter);
app.use("/api/proposal", proposalRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`WyreStorm AV Designer server running on http://localhost:${port}`);
});