import 'reflect-metadata';

import { Message } from '../serverx';
import { StatusCode200 } from './statuscode-200';

import { of } from 'rxjs';

describe('StatusCode200 unit tests', () => {

  test('sets statusCode', done => {
    const statusCode200 = new StatusCode200();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { }
    };
    statusCode200.handle(of(message))
      .subscribe(message => {
        const { response } = message;
        expect(response.statusCode).toEqual(200);
        done();
      });
  });

});
