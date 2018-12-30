import * as zlib from 'zlib';

import { Compressor } from './compressor';
import { COMPRESSOR_OPTS } from './compressor';
import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Observable } from 'rxjs';
import { Route } from '../interfaces';

import { tap } from 'rxjs/operators';

@Injectable() class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
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

  test('performs gzip compression', done => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe(response => {
      expect(response.headers['Content-Encoding']).toEqual('gzip');
      expect(zlib.unzipSync(response.body).toString()).toEqual('"Hello, http!"');
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener({ method: 'GET', url: '/foo/bar', headers: { 'Accept-Encoding': 'gzip, deflate' } } as any, { } as any);
  });

  test('performs deflate compression', done => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe(response => {
      expect(response.headers['Content-Encoding']).toEqual('deflate');
      expect(zlib.inflateSync(response.body).toString()).toEqual('"Hello, http!"');
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener({ method: 'GET', url: '/foo/bar', headers: { 'Accept-Encoding': 'deflate' } } as any, {} as any);
  });

  test('performs no compression', done => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe(response => {
      expect(response.headers['Content-Encoding']).toBeUndefined();
      expect(response.body).toEqual('"Hello, http!"');
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener({ method: 'GET', url: '/foo/bar', headers: { } } as any, { } as any);
  });

});
