import 'reflect-metadata';

import { Logger } from './logger';
import { LogProvider } from '../services/log-provider';
import { Message } from '../serverx';

import { of } from 'rxjs';

test('Logger logs a message', done => {
  const logger = new Logger({
    logMessage: msg => {
      expect(msg.request.path).toEqual(message.request.path);
      expect(msg.request.method).toEqual(message.request.method);
      done();
    }
  } as LogProvider);
  const message: Message = {
    request: { path: '/foo/bar', method: 'GET' },
    response: { }
  };
  logger.postcatch(of(message)).subscribe();
});
