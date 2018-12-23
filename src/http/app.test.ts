import { Handler } from '../handler';
import { HttpApp } from './app';
import { IncomingMessage } from 'http';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { Route } from '../serverx';

import { createServer } from 'http';
import { tap } from 'rxjs/operators';

import axios from 'axios';

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

@Injectable() class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.body = 'Goodbye, http!';
      })
    );
  }
}

@Injectable() class CORS extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        // NOTE: just the minimum CORS necessary for test case
        response.headers['Access-Control-Allow-Origin'] = '*';
      })
    );
  }
}

@Injectable() class Middleware1 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.headers['X-this'] = 'that';
      })
    );
  }
}

@Injectable() class Middleware2 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.headers['X-that'] = 'this';
      })
    );
  }
}

const routes: Route[] = [

  {
    path: '',
    middlewares: [CORS],
    children: [

      {
        methods: ['GET'],
        path: '/foo/bar',
        handler: Hello,
        middlewares: [Middleware1, Middleware2]
      },

      {
        methods: ['PUT'],
        path: '/foo/bar',
        handler: Goodbye,
        middlewares: [Middleware1]
      }

    ]
  }
  
];


// @see https://angularfirebase.com/snippets/testing-rxjs-observables-with-jest/

test('HttpApp smoke test #1', done => {
  const app = new HttpApp(routes);
  const listener = app.listen();
  app['response$'].subscribe(response => {
    expect(response.body).toEqual('"Hello, http!"');
    expect(response.headers['X-this']).toEqual('that');
    expect(response.headers['X-that']).toEqual('this');
    expect(response.statusCode).toEqual(200);
    done();
  });
  listener({ method: 'GET', url: '/foo/bar' } as IncomingMessage, { } as OutgoingMessage);
});

test('HttpApp smoke test #2', done => {
  const app = new HttpApp(routes);
  const listener = app.listen();
  app['response$'].subscribe(response => {
    expect(response.body).toEqual('"Goodbye, http!"');
    expect(response.headers['X-this']).toEqual('that');
    expect(response.headers['X-that']).toBeUndefined();
    expect(response.statusCode).toEqual(200);
    done();
  });
  listener({ method: 'PUT', url: '/foo/bar' } as IncomingMessage, { } as OutgoingMessage);
});

test('HttpApp smoke test #3', done => {
  const app = new HttpApp(routes);
  const listener = app.listen();
  app['response$'].subscribe(response => {
    expect(response.statusCode).toEqual(404);
    done();
  });
  listener({ method: 'PUT', url: '/xxx' } as IncomingMessage, { } as OutgoingMessage);
});

test('HttpApp local 200/404', async done => {
  const app = new HttpApp(routes);
  const listener = app.listen();
  const server = createServer(listener).listen(8080);
  const response = await axios.get('http://localhost:8080/foo/bar');
  expect(response.data).toEqual('Hello, http!');
  expect(response.status).toEqual(200);
  try {
    await axios.get('http://localhost:8080/xxx');
  }
  catch (error) {
    expect(error.response.status).toEqual(404);
  }
  server.close();
  done();
});
