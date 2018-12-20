import { Handler } from './handler';
import { HttpApp } from './http-app';
import { IncomingMessage } from 'http';
import { Injectable } from 'injection-js';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { Route } from './router';

import { map } from 'rxjs/operators';

@Injectable()
class Hello implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        message.response.body = 'Hello, http!';
        return message;
      })
    );
  }
}

@Injectable()
class Goodbye implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        message.response.body = 'Goodbye, http!';
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
        message.response.headers['X-this'] = 'that';
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
        message.response.headers['X-that'] = 'this';
        return message;
      })
    );
  }
}

const routes: Route[] = [

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
  
];

const app = new HttpApp(routes);

// @see https://angularfirebase.com/snippets/testing-rxjs-observables-with-jest/

test('listener smoke test #1', done => {
  const listener = app.listen();
  app.response$.subscribe(response => {
    expect(response.body).toEqual('Hello, http!');
    expect(response.headers['X-this']).toEqual('that');
    expect(response.headers['X-that']).toEqual('this');
    expect(response.statusCode).toEqual(200);
    done();
  });
  listener({ method: 'GET', url: '/foo/bar' } as IncomingMessage, {} as OutgoingMessage);
});

test('listener smoke test #2', done => {
  const listener = app.listen();
  app.response$.subscribe(response => {
    expect(response.body).toEqual('Goodbye, http!');
    expect(response.headers['X-this']).toEqual('that');
    expect(response.headers['X-that']).toBeUndefined();
    expect(response.statusCode).toEqual(200);
    done();
  });
  listener({ method: 'PUT', url: '/foo/bar' } as IncomingMessage, {} as OutgoingMessage);
});

test('listener smoke test #3', done => {
  const listener = app.listen();
  app.response$.subscribe(response => {
    expect(response.statusCode).toEqual(404);
    done();
  });
  listener({ method: 'PUT', url: '/xxx' } as IncomingMessage, {} as OutgoingMessage);
});
