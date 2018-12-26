import 'reflect-metadata';

import { LogProvider } from './log-provider';

test('LogProvider logs errors to console', done => {
  const logProvider = new LogProvider({  colorize: false, format: 'common' });
  jest.spyOn(global.console, 'log').mockImplementation(() => { });
  logProvider.logError(new Error('xxx'));
  expect(console.log).toBeCalled();
  done();
});

test('LogProvider "common" format correctly logs messages', done => {
  const logProvider = new LogProvider({ colorize: false, format: 'common' });
  jest.spyOn(global.console, 'log').mockImplementation(logLine => {
    expect(logLine).toMatch(/^::1 - - \[.*\] "GET \/foo\/bar HTTP\/1.2"/);
    done();
  });
  logProvider.logMessage({
    request: { path: '/foo/bar', method: 'GET', remoteAddr: '::1', httpVersion: '1.2', timestamp: Date.now() },
    response: { headers: {} }
  });
});

test('LogProvider "dev" format correctly logs messages', done => {
  const logProvider = new LogProvider({ colorize: false, format: 'dev' });
  jest.spyOn(global.console, 'log').mockImplementation(logLine => { 
    expect(logLine).toMatch(/^GET \/foo\/bar/);
    done();
  });
  logProvider.logMessage({
    request: { path: '/foo/bar', method: 'GET' },
    response: { headers: { } }
  });
});

test('LogProvider "short" format correctly logs messages', done => {
  const logProvider = new LogProvider({ colorize: false, format: 'short' });
  jest.spyOn(global.console, 'log').mockImplementation(logLine => {
    expect(logLine).toMatch(/^::1 - GET \/foo\/bar/);
    done();
  });
  logProvider.logMessage({
    request: { path: '/foo/bar', method: 'GET', remoteAddr: '::1' },
    response: { headers: { } }
  });
});

test('LogProvider "tiny" format correctly logs messages', done => {
  const logProvider = new LogProvider({ colorize: false, format: 'tiny' });
  jest.spyOn(global.console, 'log').mockImplementation(logLine => {
    expect(logLine).toMatch(/^GET \/foo\/bar 500 20/);
    done();
  });
  logProvider.logMessage({
    request: { path: '/foo/bar', method: 'GET' },
    response: { headers: { 'Content-Length': '20' }, statusCode: 500}
  });
});
