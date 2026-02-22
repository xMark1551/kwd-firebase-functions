"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
// logger.ts
// temporary logger
class Logger {
    constructor(context) {
        this.context = context;
    }
    info(message, meta) {
        console.log(JSON.stringify({
            level: "info",
            context: this.context,
            message,
            timestamp: new Date().toISOString(),
            ...meta,
        }));
    }
    error(message, meta) {
        console.error(JSON.stringify({
            level: "error",
            context: this.context,
            message,
            timestamp: new Date().toISOString(),
            ...meta,
        }));
    }
    warn(message, meta) {
        console.warn(JSON.stringify({
            level: "warn",
            context: this.context,
            message,
            timestamp: new Date().toISOString(),
            ...meta,
        }));
    }
}
const createLogger = (context) => new Logger(context);
exports.createLogger = createLogger;
