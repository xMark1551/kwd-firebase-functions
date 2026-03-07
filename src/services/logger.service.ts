export class LogService {
  constructor(private readonly defaultContext?: string) {}

  withContext(context: string) {
    return new LogService(context);
  }

  private format(level: string, message: string, meta?: any) {
    return {
      level,
      context: this.defaultContext,
      message,
      ...(meta && { meta }),
    };
  }

  info(message: string, meta?: any) {
    console.info("[INFO]", this.format("info", message, meta));
  }

  error(message: string, meta?: any) {
    console.error("[ERROR]", this.format("error", message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn("[WARN]", this.format("warn", message, meta));
  }
}

export const logService = new LogService();
