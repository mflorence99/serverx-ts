import 'reflect-metadata';

import { Message } from '../serverx';
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
      .subscribe(message => {
        const { response } = message;
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
      .subscribe(message => {
        const { response } = message;
        expect(response.headers['Allow']).toEqual('CONNECT,DELETE,GET,HEAD,PATCH,POST,PUT,TRACE');
        expect(response.statusCode).toEqual(200);
        done();
      });
  });

});
