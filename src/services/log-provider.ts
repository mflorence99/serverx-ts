import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { Message } from '../serverx';
import { Optional } from 'injection-js';

import chalk from 'chalk';

/**
 * Log provider options
 */

export interface LogProviderOpts {
  colorize?: boolean;
  // @see https://github.com/expressjs/morgan
  format?: 'common' | 'dev' | 'short' | 'tiny';
  silent?: boolean;
}

export const LOG_PROVIDER_OPTS = new InjectionToken<LogProviderOpts>('LOG_PROVIDER_OPTS');

export const LOG_PROVIDER_DEFAULT_OPTS: LogProviderOpts = {
  colorize: true,
  format: 'common',
  silent: false
};

/**
 * Base log provider
 * 
 * NOTE: uses console.log
 */

@Injectable() export class LogProvider { 

  private opts: LogProviderOpts;

  /** ctor */
  constructor(@Optional() @Inject(LOG_PROVIDER_OPTS) opts: LogProviderOpts) { 
    this.opts = opts || LOG_PROVIDER_DEFAULT_OPTS;
  }

  /** Log error */
  logError(error: Error): void {
    if (!this.opts.silent) {
      console.log(this.get(error.toString(), 'redBright'));
      console.log(error.stack);
    }
  }

  /** Log message */
  logMessage(message: Message): void {
    // quick exit if silent
    if (this.opts.silent) 
      return;
    const { request, response } = message;
    // response time
    const ms = `${Date.now() - request.timestamp}ms`;
    // status code color
    let color = null;
    if (response.statusCode >= 500)
      color = 'redBright';
    else if (response.statusCode >= 400)
      color = 'yellowBright';
    else if (response.statusCode >= 300)
      color = 'cyanBright';
    // develop parts of message
    let parts = [];
    switch (this.opts.format) {
      // @see https://github.com/expressjs/morgan
      case 'dev':
        parts = [
          this.get(request.method), 
          this.get(request.path), 
          this.get(response.statusCode, color), 
          ms, 
          '-', 
          this.get(response.headers['Content-Length'])
        ];
        break;
      // @see https://github.com/expressjs/morgan
      case 'short':
        parts = [
          this.get(request.remoteAddr), 
          '-', 
          this.get(request.method), 
          this.get(request.path), 
          this.get(`HTTP/${request.httpVersion}`), 
          this.get(response.statusCode, color), 
          this.get(response.headers['Content-Length']), 
          '-', 
          ms
        ];
        break;
      // @see https://github.com/expressjs/morgan
      case 'tiny':
        parts = [
          this.get(request.method),
          this.get(request.path),
          this.get(response.statusCode, color),
          this.get(response.headers['Content-Length']),
          '-',
          ms
        ];
        break;
      // @see https://github.com/expressjs/morgan
      default:
        parts = [
          this.get(request.remoteAddr),
          '-',
          '-',
          `[${new Date(request.timestamp).toISOString()}]`,
          this.get(`"${request.method}`),
          this.get(request.path),
          this.get(`HTTP/${request.httpVersion}"`),
          this.get(response.statusCode, color),
          this.get(response.headers['Content-Length'])
        ];
        break;
    }
    // now all we have to do is print it!
    console.log(parts.join((' ')));
  }

  // private methods

  private get(str: any,
              color: string = null): string {
    str = str? String(str) : '-';
    return (this.opts.colorize && color)? chalk[color](str) : str;
  }

}
