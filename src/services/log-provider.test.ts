import 'reflect-metadata';

import { LogProvider } from './log-provider';
import { Request } from '../serverx';
import { Response } from '../serverx';

const request: Request = { 
  path: '/foo/bar',
  method: 'GET', 
  remoteAddr: '::1', 
  httpVersion: '1.2', 
  timestamp: Date.now() 
};

const response: Response = { 
  headers: { 'Content-Length': '20' }, 
  statusCode: 500 
};

describe('LogProvider unit tests', () => {

  test('logs errors to console', done => {
    const logProvider = new LogProvider({ colorize: false, format: 'common' });
    jest.spyOn(global.console, 'log').mockImplementation(() => { });
    logProvider.logError(new Error('xxx'));
    expect(console.log).toBeCalled();
    done();
  });

  test('"common" format correctly logs messages', done => {
    const logProvider = new LogProvider({ colorize: false, format: 'common' });
    jest.spyOn(global.console, 'log').mockImplementation(logLine => {
      expect(logLine).toMatch(/^::1 - - \[.*\] "GET \/foo\/bar HTTP\/1.2" 500 20$/);
      done();
    });
    logProvider.logMessage({ request, response });
  });

  test('"dev" format correctly logs messages', done => {
    const logProvider = new LogProvider({ colorize: false, format: 'dev' });
    jest.spyOn(global.console, 'log').mockImplementation(logLine => {
      expect(logLine).toMatch(/^GET \/foo\/bar 500 [0-9]+ms - 20$/);
      done();
    });
    logProvider.logMessage({ request, response });
  });

  test('"short" format correctly logs messages', done => {
    const logProvider = new LogProvider({ colorize: false, format: 'short' });
    jest.spyOn(global.console, 'log').mockImplementation(logLine => {
      expect(logLine).toMatch(/^::1 - GET \/foo\/bar HTTP\/1.2 500 20 - [0-9]+ms$/);
      done();
    });
    logProvider.logMessage({ request, response });
  });

  test('"tiny" format correctly logs messages', done => {
    const logProvider = new LogProvider({ colorize: false, format: 'tiny' });
    jest.spyOn(global.console, 'log').mockImplementation(logLine => {
      expect(logLine).toMatch(/^GET \/foo\/bar 500 20 - [0-9]+ms$/);
      done();
    });
    logProvider.logMessage({ request, response });
  });

});
