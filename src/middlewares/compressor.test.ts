import { Compressor } from './compressor';
import { COMPRESSOR_OPTS } from './compressor';
import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Message } from '../interfaces';
import { Route } from '../interfaces';

import * as zlib from 'zlib';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

@Injectable()
class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.body = 'Hello, http!';
      })
    );
  }
}

const routes: Route[] = [
  {
    path: '',
    middlewares: [Compressor],
    services: [{ provide: COMPRESSOR_OPTS, useValue: { threshold: 0 } }],
    children: [
      {
        methods: ['GET'],
        path: '/foo/bar',
        handler: Hello
      }
    ]
  }
];

describe('Compressor unit tests', () => {
  test('performs gzip compression', (done) => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe((response) => {
      expect(response.headers['Content-Encoding']).toEqual('gzip');
      expect(zlib.unzipSync(response.body).toString()).toEqual(
        '"Hello, http!"'
      );
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener(
      {
        method: 'GET',
        url: '/foo/bar',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Accept-Encoding': 'gzip, deflate' }
      } as any,
      {} as any
    );
  });

  test('performs deflate compression', (done) => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe((response) => {
      expect(response.headers['Content-Encoding']).toEqual('deflate');
      expect(zlib.inflateSync(response.body).toString()).toEqual(
        '"Hello, http!"'
      );
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener(
      {
        method: 'GET',
        url: '/foo/bar',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Accept-Encoding': 'deflate' }
      } as any,
      {} as any
    );
  });

  test('performs no compression', (done) => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe((response) => {
      expect(response.headers['Content-Encoding']).toBeUndefined();
      expect(response.body).toEqual('"Hello, http!"');
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener({ method: 'GET', url: '/foo/bar', headers: {} } as any, {} as any);
  });
});
