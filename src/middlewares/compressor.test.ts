import 'reflect-metadata';

import { Compressor } from './compressor';
import { COMPRESSOR_OPTS } from './compressor';
import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { Route } from '../serverx';

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

  test('sets appropriate headers', done => {
    const app = new HttpApp(routes);
    const listener = app.listen();
    app['response$'].subscribe(response => {
      expect(response.headers['Content-Encoding']).toEqual('gzip');
      expect(response.statusCode).toEqual(200);
      done();
    });
    listener({ method: 'GET', url: '/foo/bar', headers: { 'Accept-Encoding': 'gzip' } } as any, { } as any);
  });

});
