import { Handler } from './handler';
import { HttpApp } from './http-app';
import { IncomingMessage } from 'http';
import { Injectable } from 'injection-js';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { OutgoingMessage } from 'http';
import { Route } from './router';

import { tap } from 'rxjs/operators';

@Injectable()
class Handler1 implements Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(message => {
        console.log('Handler1', message);
      })
    );
  }
}

@Injectable()
class Middleware1 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(message => {
        console.log('Middleware1', message);
      })
    );
  }
}

@Injectable()
class Middleware2 implements Middleware {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(message => {
        console.log('Middleware2', message);
      })
    );
  }
}

const routes: Route[] = [

  {
    path: '/foo',
    handler: Handler1,
    middlewares: [Middleware1, Middleware2]
  }
  
];

const app = new HttpApp(routes);

test('xxx', () => {
  const listener = app.listener();
  listener({ method: 'GET', url: '/xxx' } as IncomingMessage, 
           { } as OutgoingMessage);
  listener({ method: 'GET', url: '/foo' } as IncomingMessage,
           { } as OutgoingMessage);
  expect(true).toBeTruthy();
});
