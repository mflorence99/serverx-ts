import { Handler } from '../handler';
import { HttpApp } from './app';
import { IncomingMessage } from 'http';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Middleware } from '../middleware';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { Route } from '../router';

import { createServer } from 'http';
import { map } from 'rxjs/operators';

import axios from 'axios';

@Injectable()
class Hello implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        const body = 'Hello, http!';
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

@Injectable()
class Goodbye implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        const body = 'Goodbye, http!';
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

@Injectable()
class CORS implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        // NOTE: just the minimum CORS necessary for test case
        response.headers['Access-Control-Allow-Origin'] = '*';
        return message;
      })
    );
  }
}

@Injectable()
class Middleware1 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        response.headers['X-this'] = 'that';
        return message;
      })
    );
  }
}

@Injectable()
class Middleware2 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        response.headers['X-that'] = 'this';
        return message;
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
