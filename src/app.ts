import express from "express";
import { corsConfig } from "./middleware/cors";
import { optionalAuth } from "./middleware/optional-auth";
import { errorHandler } from "./middleware/handler";
import { logService } from "./services/logger.service";

import dotenv from "dotenv";
dotenv.config();
// import { initRedis } from "./lib/redis";

import routes from "./routers";

export const app = express();

app.use(corsConfig);
app.use(express.json());

app.use(optionalAuth);
app.use((req, res, next) => {
  logService.info(`[${req.method}] ${req.path}`, {
    ip: req.ip,
    user: {
      uid: req.user?.uid ?? "anonymous",
      admin: req.user?.admin ?? false,
      username: req.user?.username ?? "",
    },
  });
  next();
});

app.use("/", routes);

app.use(errorHandler);
app.set("trust proxy", true);

// initRedis();
