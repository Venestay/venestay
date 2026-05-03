const isDev = import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, ...optionalParams: unknown[]) {
    if (!isDev) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

    switch (level) {
      case 'info':
        console.log(formattedMessage, ...optionalParams);
        break;
      case 'warn':
        console.warn(formattedMessage, ...optionalParams);
        break;
      case 'error':
        console.error(formattedMessage, ...optionalParams);
        break;
    }
  }

  info(message: string, ...optionalParams: unknown[]) {
    this.log('info', message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    this.log('warn', message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]) {
    this.log('error', message, ...optionalParams);
  }
}

export const logger = new Logger();


