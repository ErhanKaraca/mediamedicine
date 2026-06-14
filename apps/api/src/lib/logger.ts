export function createLogger(requestId: string, extra?: Record<string, unknown>) {
  return {
    info: (message: string, fields?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: "info", message, requestId, ...extra, ...fields }));
    },
    warn: (message: string, fields?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: "warn", message, requestId, ...extra, ...fields }));
    },
    error: (message: string, fields?: Record<string, unknown>) => {
      console.error(JSON.stringify({ level: "error", message, requestId, ...extra, ...fields }));
    },
  };
}
