import express from "express";
import { corsConfig } from "./middleware/cors";
import { auth } from "./middleware/auth";
import { contextMiddleware } from "./middleware/contextMiddleware";
import { errorHandler } from "./middleware/handler";

import dotenv from "dotenv";
dotenv.config();
// import { initRedis } from "./lib/redis";

import routes from "./routers";

export const app = express();

app.use(corsConfig);
app.use(express.json());

app.use(auth);
app.use(contextMiddleware);
app.use("/", routes);

app.use(errorHandler);
app.set("trust proxy", true);

// initRedis();
