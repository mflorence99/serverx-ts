import { LogProvider } from './log-provider';

describe('LogProvider unit tests', () => {

  test('console.log proxy', done => {
    const logProvider = new LogProvider();
    jest.spyOn(global.console, 'log').mockImplementation(() => { });
    logProvider.log('xxx');
    expect(console.log).toBeCalled();
    done();
  });

  test('console.info proxy', done => {
    const logProvider = new LogProvider();
    jest.spyOn(global.console, 'info').mockImplementation(() => { });
    logProvider.info('xxx');
    expect(console.info).toBeCalled();
    done();
  });

  test('console.warn proxy', done => {
    const logProvider = new LogProvider();
    jest.spyOn(global.console, 'warn').mockImplementation(() => { });
    logProvider.warn('xxx');
    expect(console.warn).toBeCalled();
    done();
  });

  test('console.error proxy', done => {
    const logProvider = new LogProvider();
    jest.spyOn(global.console, 'error').mockImplementation(() => { });
    logProvider.error('xxx');
    expect(console.error).toBeCalled();
    done();
  });

});
