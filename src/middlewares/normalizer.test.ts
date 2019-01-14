import { Message } from '../interfaces';
import { Normalizer } from './normalizer';

import { of } from 'rxjs';

describe('Normalizer unit tests', () => {

  test('sets statusCode 200', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { body: 'hello', headers: { } }
    };
    normalizer.posthandle(of(message))
    .subscribe(({ response }) => {
      expect(response.statusCode).toEqual(200);
      done();
    });
  });

  test('sets statusCode 204', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { headers: {} }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.statusCode).toEqual(204);
        done();
      });
  });

  test('leaves statusCode alone', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { headers: { }, statusCode: 500 }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.statusCode).toEqual(500);
        done();
      });
  });

  test('deduces Content-Type from path', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar.html', method: 'GET' },
      response: { headers: { } }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Content-Type']).toEqual('text/html');
        done();
      });
  });

  test('sets default Content-Type to JSON', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { body: { x: 'y' }, headers: { } }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Content-Type']).toEqual('application/json');
        expect(response.body).toEqual(JSON.stringify({ x: 'y' }));
        done();
      });
  });

  test('sets default Content-Length', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { body: 'xyz', headers: { } }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Content-Length']).toEqual(5);
        done();
      });
  });

  test('sets default Cache-Control', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { body: 'xyz', headers: { } }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Cache-Control']).toEqual('no-cache, no-store, must-revalidate');
        done();
      });
  });

  test('leaves Cache-Control alone if already set', done => {
    const normalizer = new Normalizer();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET' },
      response: { body: 'xyz', headers: { 'Cache-Control': 'public' } }
    };
    normalizer.posthandle(of(message))
      .subscribe(({ response }) => {
        expect(response.headers['Cache-Control']).toEqual('public');
        done();
      });
  });

});
