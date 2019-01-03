import { CORS } from './cors';
import { Message } from '../interfaces';

import { caseInsensitiveObject } from '../utils';
import { of } from 'rxjs';

describe('CORS unit tests', () => {

  test('smoke test', done => {
    const cors = new CORS(null);
    const message: Message = {
      request: { path: '', method: 'GET', headers: caseInsensitiveObject({ }) },
      response: { headers: caseInsensitiveObject({ }) }
    };
    cors.prehandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Access-Control-Allow-Origin']).toEqual('*');
        done();
      });
  });

  test('test preflightContinue', done => {
    const cors = new CORS({ origin: 'o', preflightContinue: false });
    const message: Message = {
      request: { path: '', method: 'OPTIONS', headers: caseInsensitiveObject({ }) },
      response: { headers: caseInsensitiveObject({ }) }
    };
    cors.prehandle(of(message))
      .subscribe({
        next: () => { },
        error: ({ exception }) => {
          expect(exception.headers['Access-Control-Allow-Origin']).toEqual('o');
          expect(exception.headers['Content-Length']).toEqual('0');
          expect(exception.headers['Vary']).toEqual('Origin, Access-Control-Request-Headers');
          expect(exception.statusCode).toEqual(204);
          done();
        }
      });
  });

  test('test origin', done => {
    const cors = new CORS({ origin: 'o', preflightContinue: true });
    const message: Message = {
      request: { path: '', method: 'GET', headers: caseInsensitiveObject({ }) },
      response: { headers: caseInsensitiveObject({ }) }
    };
    cors.prehandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Access-Control-Allow-Origin']).toEqual('o');
        expect(response.headers['Vary']).toEqual('Origin');
        done();
      });
  });

});
