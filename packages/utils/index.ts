import mri from 'mri';
import resolve from 'resolve';
import * as tapable from 'tapable';
import chalk from 'chalk';
import cheerio, { CheerioAPI, Cheerio, CheerioOptions } from 'cheerio';
import fs from 'fs-extra';
import getCSSModuleLocalIdent from './getCSSModuleLocalIdent';
import getCacheIdentifier from './getCacheIdentifier';

export { cheerio, Cheerio, CheerioAPI, CheerioOptions };

export { mri, resolve, tapable, chalk, fs, getCSSModuleLocalIdent, getCacheIdentifier };

export function makeReadonly<T extends { [index: string]: any }>(obj: T, errMsg: string) {
  return new Proxy(obj, {
    get(target, prop: string) {
      if (target) {
        return target[prop];
      }
      return undefined;
    },
    set() {
      throw Error(errMsg);
    },
  });
}
