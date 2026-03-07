"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logService = exports.LogService = void 0;
class LogService {
    constructor(defaultContext) {
        this.defaultContext = defaultContext;
    }
    withContext(context) {
        return new LogService(context);
    }
    format(level, message, meta) {
        return {
            level,
            context: this.defaultContext,
            message,
            ...(meta && { meta }),
        };
    }
    info(message, meta) {
        console.info("[INFO]", this.format("info", message, meta));
    }
    error(message, meta) {
        console.error("[ERROR]", this.format("error", message, meta));
    }
    warn(message, meta) {
        console.warn("[WARN]", this.format("warn", message, meta));
    }
}
exports.LogService = LogService;
exports.logService = new LogService();
