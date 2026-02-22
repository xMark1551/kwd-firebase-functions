// logger.ts
// temporary logger
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, meta?: any) {
    console.log(
      JSON.stringify({
        level: "info",
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  }

  error(message: string, meta?: any) {
    console.error(
      JSON.stringify({
        level: "error",
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  }

  warn(message: string, meta?: any) {
    console.warn(
      JSON.stringify({
        level: "warn",
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  }
}

export const createLogger = (context: string) => new Logger(context);
