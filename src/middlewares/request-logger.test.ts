import { LogProvider } from '../services/log-provider';
import { Request } from '../interfaces';
import { RequestLogger } from './request-logger';
import { RequestLoggerOpts } from './request-logger';
import { Response } from '../interfaces';

import { of } from 'rxjs';

const request: Request = {
  path: '/foo/bar',
  method: 'GET',
  remoteAddr: '::1',
  httpVersion: '1.2',
  timestamp: Date.now()
};

const response: Response = {
  headers: { 'Content-Length': '20' },
  statusCode: 301
};

const error: Response = {
  body: JSON.stringify({
    error: 'xxx',
    stack: 'y'
  }),
  headers: { 'Content-Length': '20' },
  statusCode: 500
};

describe('RequestLogger unit tests', () => {

  test('logs errors to console', done => {
    const log: LogProvider = {
      canColorize: () => false,
      log: stuff => { },
      info: stuff => { },
      warn: stuff => { },
      error: logLine => {
        expect(logLine).toContain('xxx'); 
        done();
      },
    };
    const opts: RequestLoggerOpts = { colorize: false, format: 'common' };
    const logger = new RequestLogger(log, opts);
    logger.postcatch(of({ request, response: error })).subscribe();
  });

  test('silent mode logs nothing', done => {
    const log: LogProvider = {
      canColorize: () => false,
      log: stuff => { },
      info: stuff => { },
      warn: stuff => { },
      error: logLine => { },
    };
    jest.spyOn(log, 'info');
    const opts: RequestLoggerOpts = { silent: true };
    const logger = new RequestLogger(log, opts);
    logger.postcatch(of({ request, response })).subscribe(() => {
      expect(log.info).not.toBeCalled();
      done();
    });
  });

  test('"common" format correctly logs messages', done => {
    const log: LogProvider = {
      canColorize: () => false,
      log: stuff => { },
      info: logLine => { 
        expect(logLine).toMatch(/^::1 - - \[.*\] "GET \/foo\/bar HTTP\/1.2" 301 20$/);
        done();
      },
      warn: stuff => { },
      error: stuff => { },
    };
    const opts: RequestLoggerOpts = { colorize: false, format: 'common' };
    const logger = new RequestLogger(log, opts);
    logger.postcatch(of({ request, response })).subscribe();
  });

  test('"dev" format correctly logs messages', done => {
    const log: LogProvider = {
      canColorize: () => false,
      log: stuff => { },
      info: logLine => {
        expect(logLine).toMatch(/^GET \/foo\/bar 301 [0-9]+ms - 20$/);
        done();
      },
      warn: stuff => { },
      error: stuff => { },
    };
    const opts: RequestLoggerOpts = { colorize: false, format: 'dev' };
    const logger = new RequestLogger(log, opts);
    logger.postcatch(of({ request, response })).subscribe();
  });

  test('"short" format correctly logs messages', done => {
    const log: LogProvider = {
      canColorize: () => false,
      log: stuff => { },
      info: logLine => {
        expect(logLine).toMatch(/^::1 - GET \/foo\/bar HTTP\/1.2 301 20 - [0-9]+ms$/);
        done();
      },
      warn: stuff => { },
      error: stuff => { },
    };
    const opts: RequestLoggerOpts = { colorize: false, format: 'short' };
    const logger = new RequestLogger(log, opts);
    logger.postcatch(of({ request, response })).subscribe();
  });

  test('"tiny" format correctly logs messages', done => {
    const log: LogProvider = {
      canColorize: () => false,
      log: stuff => { },
      info: logLine => {
        expect(logLine).toMatch(/^GET \/foo\/bar 301 20 - [0-9]+ms$/);
        done();
      },
      warn: stuff => { },
      error: stuff => { },
    };
    const opts: RequestLoggerOpts = { colorize: false, format: 'tiny' };
    const logger = new RequestLogger(log, opts);
    logger.postcatch(of({ request, response })).subscribe();
  });

});
