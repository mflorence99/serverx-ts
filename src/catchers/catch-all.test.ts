import 'reflect-metadata';

import { CatchAll } from './catch-all';
import { LogProvider } from '../services/log-provider';

import { of } from 'rxjs';

describe('CatchAll unit tests', () => {

  test('turns an error into a message', done => {
    const catchAll = new CatchAll({
      logError: msg => { }
    } as LogProvider);
    const error = new Error('xxx');
    catchAll.catch(of(error))
      .subscribe(message => {
        const { response } = message;
        expect(response.body).toContain('xxx');
        expect(response.headers['Content-Type']).toEqual('application/json');
        expect(response.statusCode).toEqual(500);
        done();
      });
  });

});
