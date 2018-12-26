import 'reflect-metadata';

import { Message } from '../serverx';
import { Normalizer } from './normalizer';

import { of } from 'rxjs';

test('Normalizer middleware sets statusCode', done => {
  const normalizer = new Normalizer();
  const message: Message = {
    request: { path: '/foo/bar', method: 'GET' },
    response: { }
  };
  normalizer.posthandle(of(message))
  .subscribe(message => {
    const { response } = message;
    expect(response.statusCode).toEqual(200);
    done();
  });
});

test('Normalizer middleware leaves statusCode alone', done => {
  const normalizer = new Normalizer();
  const message: Message = {
    request: { path: '/foo/bar', method: 'GET' },
    response: { statusCode: 500 }
  };
  normalizer.posthandle(of(message))
    .subscribe(message => {
      const { response } = message;
      expect(response.statusCode).toEqual(500);
      done();
    });
});

test('Normalizer middleware deduces Content-Type from path', done => {
  const normalizer = new Normalizer();
  const message: Message = {
    request: { path: '/foo/bar.html', method: 'GET' },
    response: { }
  };
  normalizer.posthandle(of(message))
    .subscribe(message => {
      const { response } = message;
      expect(response.headers['Content-Type']).toEqual('text/html');
      done();
    });
});

test('Normalizer middleware sets default Content-Type to JSON', done => {
  const normalizer = new Normalizer();
  const message: Message = {
    request: { path: '/foo/bar', method: 'GET' },
    response: { body: { x: 'y' } }
  };
  normalizer.posthandle(of(message))
    .subscribe(message => {
      const { response } = message;
      expect(response.headers['Content-Type']).toEqual('application/json');
      expect(response.body).toEqual(JSON.stringify({ x: 'y' }));
      done();
    });
});

test('Normalizer middleware sets default Content-Length', done => {
  const normalizer = new Normalizer();
  const message: Message = {
    request: { path: '/foo/bar', method: 'GET' },
    response: { body: 'xyz' }
  };
  normalizer.posthandle(of(message))
    .subscribe(message => {
      const { response } = message;
      expect(response.headers['Content-Length']).toEqual(5);
      done();
    });
});
