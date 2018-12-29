import { Inject } from 'injection-js';
import { Injectable } from 'injection-js';
import { InjectionToken } from 'injection-js';
import { LogProvider } from '../services/log-provider';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { Optional } from 'injection-js';
import { StatusCode } from '../interfaces';

import { tap } from 'rxjs/operators';

import chalk from 'chalk';

/**
 * Request logger options
 */

export interface RequestLoggerOpts {
  colorize?: boolean;
  // @see https://github.com/expressjs/morgan
  format?: 'common' | 'dev' | 'short' | 'tiny';
  silent?: boolean;
}

export const REQUEST_LOGGER_OPTS = new InjectionToken<RequestLoggerOpts>('REQUEST_LOGGER_OPTS');

export const REQUEST_LOGGER_DEFAULT_OPTS: RequestLoggerOpts = {
  colorize: true,
  format: 'common',
  silent: false
};

/**
 * Request logger
 */

@Injectable() export class RequestLogger extends Middleware {

  private opts: RequestLoggerOpts;

  constructor(private log: LogProvider,
              @Optional() @Inject(REQUEST_LOGGER_OPTS) opts: RequestLoggerOpts) {
    super();
    this.opts = opts || REQUEST_LOGGER_DEFAULT_OPTS;
  }

  postcatch(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        if (!this.opts.silent) {
          const { response } = message;
          if (response.statusCode === StatusCode.INTERNAL_SERVER_ERROR)
            this.logError(message);
          this.logMessage(message);
        }
      })
    );
  }

  // private methods

  private get(str: any,
              color: string = null): string {
    str = str ? String(str) : '-';
    return (this.log.canColorize() && this.opts.colorize && color)? chalk[color](str) : str;
  }

  private logError(message: Message): void {
    try {
      // NOTE: we have to reparse because the error got generated after the Normalizer
      const body = JSON.parse(message.response.body);
      this.log.error(this.get(body.error, 'redBright'));
      this.log.error(body.stack);
    }
    catch (ignored) { }
  }

  private logMessage(message: Message): void {
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
    this.log.info(parts.join((' ')));
  }

}

