"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = require("./middleware/cors");
const optional_auth_1 = require("./middleware/optional-auth");
const handler_1 = require("./middleware/handler");
const logger_service_1 = require("./services/logger.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// import { initRedis } from "./lib/redis";
const routers_1 = __importDefault(require("./routers"));
exports.app = (0, express_1.default)();
exports.app.use(cors_1.corsConfig);
exports.app.use(express_1.default.json());
exports.app.use(optional_auth_1.optionalAuth);
exports.app.use((req, res, next) => {
    logger_service_1.logService.info(`[${req.method}] ${req.path}`, {
        ip: req.ip,
        user: {
            uid: req.user?.uid ?? "anonymous",
            admin: req.user?.admin ?? false,
            username: req.user?.username ?? "",
        },
    });
    next();
});
exports.app.use("/", routers_1.default);
exports.app.use(handler_1.errorHandler);
exports.app.set("trust proxy", true);
// initRedis();
