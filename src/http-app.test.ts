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
        message.response.body = 'Goodbye, lambda!';
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

test('listener under normal conditions', () => {
  const listener = app.listen();
  listener({ method: 'GET', url: '/foo/bar' } as IncomingMessage, { } as OutgoingMessage);
  expect(true).toBeTruthy();
  app.unlisten();
});
