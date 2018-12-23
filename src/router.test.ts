import { Error } from './serverx';
import { Handler } from './handler';
import { Injectable } from 'injection-js';
import { Message } from './serverx';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { Route } from './serverx';
import { Router } from './router';
import { StatusCode } from './serverx';

import { switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable() class Service2 { }

@Injectable() class Service1 {
  constructor(public service: Service2) { }
}

@Injectable() class Handler1 extends Handler {
  constructor(public service: Service1) { 
    super();
  }
}

@Injectable() class NotFound extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      switchMap(() =>
        throwError(new Error({ statusCode: StatusCode.NOT_FOUND } ))
      )
    );
  }
}

@Injectable() class Middleware1 extends Middleware { }

@Injectable() class Middleware2 extends Middleware { }

@Injectable() class Middleware3 extends Middleware {
  constructor(public service: Service1) { 
    super();
  }
}

const routes: Route[] = [

  {
    path: '',
    data: '/',
    middlewares: [Middleware1, Middleware2],
    services: [Service2],
    children: [

      {
        path: '/foo',
        children: [

          {
            methods: ['GET'],
            path: '/bar',
            data: '/foo/bar',
            children: [

              {
                path: '/this/:id/:user',
                services: [Service1],
                handler: Handler1,
                data: '/foo/bar/this/:id/:user'
              },

              {
                path: '/that/:partner',
                services: [Service1],
                handler: Handler1,
                data: '/foo/bar/that/:partner'
              },

              {
                path: '**',
                handler: NotFound,
                data: '/foo/bar/this no match'
              }

            ]
          },

          {
            path: null,
            methods: ['GET'],
            services: [Service1],
            children: [

              {
                path: '/fizz/baz',
                middlewares: [Middleware3],
                data: '/foo/fizz/baz'
              }

            ]
          },

          {
            path: '/',
            methods: ['POST'],
            children: [

              {
                path: '/fizz/baz/buzz',
                pathMatch: 'prefix',
                data: '/foo/fizz/baz/buzz'
              },

              {
                path: '/fizz/baz',
                pathMatch: 'full'
              },

              {
                path: '**',
                handler: NotFound,
                data: '/foo/fizz/baz/full no match'
              }

            ]
          }

        ]
      }

    ]
  }

];

const router = new Router(routes);

test('GET / matches', () => {
  const message: Message = { request: { method: 'GET', path: '/' } };
  const route = router.route(message).request.route;
  expect(route.data).toEqual('/');
  const middlewares = Middleware.makeInstances(route);
  expect(middlewares.length).toEqual(2);
  expect(middlewares[0] instanceof Middleware1).toBeTruthy();
  expect(middlewares[1] instanceof Middleware2).toBeTruthy();
});

test('GET /fizz no match', () => {
  const message: Message = { request: { method: 'GET', path: '/fizz' } };
  expect(router.route(message).request.route.phantom).toBeTruthy();
});

test('GET /foo/bar matches', () => {
  const message: Message = { request: { method: 'GET', path: '/foo/bar' } };
  const route = router.route(message).request.route;
  expect(route.data).toEqual('/foo/bar');
  const middlewares = Middleware.makeInstances(route);
  expect(middlewares.length).toEqual(0);
});

test('GET /foo/bar/this no match', () => {
  const message: Message = { request: { method: 'GET', path: '/foo/bar/this' } };
  const route = router.route(message).request.route;
  expect(route.data).toEqual('/foo/bar/this no match');
  const handler = Handler.makeInstance(route);
  expect(handler instanceof NotFound).toBeTruthy();
});

test('GET /foo/bar/this/10/mark matches', () => {
  const message: Message = { request: { method: 'GET', path: '/foo/bar/this/10/mark' } };
  const request = router.route(message).request;
  expect(request.route.data).toEqual('/foo/bar/this/:id/:user');
  const handler = Handler.makeInstance<Handler1>(request.route);
  expect(handler instanceof Handler1).toBeTruthy();
  expect(handler.service instanceof Service1).toBeTruthy();
  expect(handler.service.service instanceof Service2).toBeTruthy();
  expect(request.params).toEqual({ id: '10', user: 'mark' });
});

test('GET /foo/bar/that/company matches', () => {
  const message: Message = { request: { method: 'GET', path: '/foo/bar/that/company' } };
  const request = router.route(message).request;
  expect(request.route.data).toEqual('/foo/bar/that/:partner');
  expect(request.params).toEqual({ partner: 'company' });
});

test('GET /foo/fizz/baz/x matches', () => {
  const message: Message = { request: { method: 'GET', path: '/foo/fizz/baz/' } };
  const route = router.route(message).request.route;
  expect(route.data).toEqual('/foo/fizz/baz');
  const middlewares = Middleware.makeInstances(route);
  expect(middlewares.length).toEqual(1);
  expect(middlewares[0] instanceof Middleware3).toBeTruthy();
});

test('POST /foo/fizz/baz/full no match', () => {
  const message: Message = { request: { method: 'POST', path: '/foo/fizz/baz/full' } };
  const request = router.route(message).request;
  expect(request.route.data).toEqual('/foo/fizz/baz/full no match');
  const handler = Handler.makeInstance(request.route);
  expect(handler instanceof NotFound).toBeTruthy();
});

test('POST /foo/fizz/baz/buzz matches', () => {
  const message: Message = { request: { method: 'POST', path: '/foo/fizz/baz/buzz' } };
  expect(router.route(message).request.route.data).toEqual('/foo/fizz/baz/buzz');
});
