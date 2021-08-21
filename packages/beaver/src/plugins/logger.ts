import chalk from 'chalk';
import { IApi } from '../api';

export default (api: IApi) => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  api.registerMethod('getLogger', Logger.getLogger);
  api.registerMethod('setGlobalLogLevel', setGlobalLogLevel);
  api.registerMethod('getGlobalLogLevel', getGlobalLogLevel);
};

export enum ELogLevel {
  debug,
  info,
  warn,
  error,
  none,
}

let globalLogLevel = ELogLevel.none;

function setGlobalLogLevel(level: ELogLevel) {
  globalLogLevel = level;
}

function getGlobalLogLevel() {
  return globalLogLevel;
}

export interface ILogType {
  bg: string;
  label: string;
  level: ELogLevel;
}

const logTypes: {
  [key: string]: ILogType;
} = {
  debug: {
    bg: 'bgMagenta',
    label: 'DEBUG',
    level: ELogLevel.debug,
  },
  info: {
    bg: 'bgBlue',
    label: 'INFO',
    level: ELogLevel.info,
  },
  warn: {
    bg: 'bgYellow',
    label: 'WARN',
    level: ELogLevel.warn,
  },
  error: {
    bg: 'bgRed',
    label: 'ERROR',
    level: ELogLevel.error,
  },
};

export interface ILogOptions {
  level: ELogLevel;
}

export type TGetLogger = typeof Logger.getLogger;

class Logger {
  private static memo = new Map<string, Logger>();

  private level: ELogLevel;

  protected constructor(private name: string, private options: ILogOptions = { level: ELogLevel.info }) {
    this.level = this.options.level;
  }

  static getLogger(name: string, options?: ILogOptions) {
    if (!Logger.memo.has(name)) {
      Logger.memo.set(name, new Logger(name, options));
    }
    return Logger.memo.get(name)!;
  }

  debug = this.addMethods(logTypes.debug);

  info = this.addMethods(logTypes.info);

  warn = this.addMethods(logTypes.warn);

  error = this.addMethods(logTypes.error);

  setLevel(level: ELogLevel) {
    this.level = level;
  }

  getLevel() {
    return this.level;
  }

  private addMethods(logType: ILogType) {
    const self = this;

    return function loggerMethod(...args: any[]) {
      const { bg, label, level } = logType;

      if (!self.checkLevel(level)) {
        return;
      }

      console.log((chalk.black as any)[bg](label), ...args);
    };
  }

  private checkLevel(type: ELogLevel) {
    if (type < this.level && type < globalLogLevel) {
      return false;
    }
    return true;
  }
}
