import express from "express";
import { corsConfig } from "./middleware/cors";
import { errorHandler } from "./middleware/handler";
import { initRedis } from "./lib/redis";

import routes from "./routers";

export const app = express();

app.use(corsConfig);
app.use(express.json());
app.use("/", routes);

app.use(errorHandler);

initRedis();
