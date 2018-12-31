import { ALL_METHODS } from '../interfaces';
import { Message } from '../interfaces';
import { NotFound } from './not-found';

import { of } from 'rxjs';

describe('NotFound unit tests', () => {

  test('sets statusCode', done => {
    const notFound = new NotFound();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { }
    };
    notFound.handle(of(message))
      .subscribe(({ response }) => {
        expect(response.statusCode).toEqual(404);
        done();
      });
  });

  test('handles pre-flight OPTIONS', done => {
    const notFound = new NotFound();
    const message: Message = {
      request: { path: '/foo/bar', method: 'OPTIONS' },
      response: { headers: { } }
    };
    notFound.handle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Allow']).toEqual(ALL_METHODS.join(','));
        expect(response.statusCode).toEqual(200);
        done();
      });
  });

});
