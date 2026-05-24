import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { publicRouter } from "./routes/public.js";

const app = express();
const allowedOrigins = new Set([
  config.clientOrigin,
  "http://127.0.0.1:3000",
  "http://localhost:3000"
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(["/api/auth", "/api/projects"], (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api", publicRouter);

app.listen(config.port, () => {
  console.log(`LaughingWaffle API listening on http://127.0.0.1:${config.port}`);
});
