import { Exception } from './interfaces';
import { FILE_SERVER_OPTS } from './handlers/file-server';
import { FileServer } from './handlers/file-server';
import { Handler } from './handler';
import { Message } from './interfaces';
import { Middleware } from './middleware';
import { NotFound } from './handlers/not-found';
import { Route } from './interfaces';
import { Router } from './router';
import { StatusCode200 } from './handlers/statuscode-200';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { mergeMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
class Service2 {}

@Injectable()
class Service1 {
  constructor(public service: Service2) {}
}

@Injectable()
class Handler1 extends Handler {
  constructor(public service: Service1) {
    super();
  }
}

@Injectable()
class NoMatch extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      mergeMap(() => throwError(new Exception({ statusCode: 404 })))
    );
  }
}

@Injectable()
class Middleware1 extends Middleware {}

@Injectable()
class Middleware2 extends Middleware {}

@Injectable()
class Middleware3 extends Middleware {
  constructor(public service: Service1) {
    super();
  }
}

const routes: Route[] = [
  {
    path: '',
    middlewares: [Middleware1, Middleware2],
    services: [
      Service2,
      { provide: FILE_SERVER_OPTS, useValue: { root: '/tmp' } }
    ],
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
                path: '/public',
                handler: FileServer,
                data: '/foo/bar/public'
              },

              {
                path: '/this/{id}/{user}',
                services: [Service1],
                handler: Handler1,
                data: '/foo/bar/this{id}/{user}'
              },

              {
                path: '/that/{partner}',
                services: [Service1],
                handler: Handler1,
                data: '/foo/bar/that/{partner}'
              },

              {
                path: '**',
                handler: NoMatch,
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
                handler: NoMatch,
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

describe('Router unit tests', () => {
  test('routes can be flattened', () => {
    const flattened = router.flatten();
    expect(flattened.length).toEqual(6);
    expect(flattened[0].path).toEqual('/foo/bar/public');
  });

  test('GET /foo no match', () => {
    const message: Message = { request: { method: 'GET', path: '/foo' } };
    const route = router.route(message).request.route;
    const handler = Handler.makeInstance(route);
    expect(handler instanceof NotFound).toBeTruthy();
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
    const handler = Handler.makeInstance(route);
    expect(handler instanceof NotFound).toBeTruthy();
  });

  test('GET /foo/bar/this no match', () => {
    const message: Message = {
      request: { method: 'GET', path: '/foo/bar/this' }
    };
    const route = router.route(message).request.route;
    expect(route.data).toEqual('/foo/bar/this no match');
    const handler = Handler.makeInstance(route);
    expect(handler instanceof NoMatch).toBeTruthy();
  });

  test('GET /foo/bar/this/10/mark matches', () => {
    const message: Message = {
      request: { method: 'GET', path: '/foo/bar/this/10/mark' }
    };
    const request = router.route(message).request;
    expect(request.route.data).toEqual('/foo/bar/this{id}/{user}');
    const handler = Handler.makeInstance<Handler1>(request.route);
    expect(handler instanceof Handler1).toBeTruthy();
    expect(handler.service instanceof Service1).toBeTruthy();
    expect(handler.service.service instanceof Service2).toBeTruthy();
    expect(request.params).toEqual({ id: '10', user: 'mark' });
  });

  test('GET /foo/bar/that/company matches', () => {
    const message: Message = {
      request: { method: 'GET', path: '/foo/bar/that/company' }
    };
    const request = router.route(message).request;
    expect(request.route.data).toEqual('/foo/bar/that/{partner}');
    expect(request.params).toEqual({ partner: 'company' });
  });

  test('GET /foo/fizz/baz matches', () => {
    const message: Message = {
      request: { method: 'GET', path: '/foo/fizz/baz/' }
    };
    const route = router.route(message).request.route;
    expect(route.data).toEqual('/foo/fizz/baz');
    const middlewares = Middleware.makeInstances(route);
    expect(middlewares.length).toEqual(1);
    expect(middlewares[0] instanceof Middleware3).toBeTruthy();
    const handler = Handler.makeInstance(route);
    expect(handler instanceof StatusCode200).toBeTruthy();
  });

  test('POST /foo/fizz/baz/full no match', () => {
    const message: Message = {
      request: { method: 'POST', path: '/foo/fizz/baz/full' }
    };
    const request = router.route(message).request;
    expect(request.route.data).toEqual('/foo/fizz/baz/full no match');
    const handler = Handler.makeInstance(request.route);
    expect(handler instanceof NoMatch).toBeTruthy();
  });

  test('POST /foo/fizz/baz/buzz matches', () => {
    const message: Message = {
      request: { method: 'POST', path: '/foo/fizz/baz/buzz' }
    };
    expect(router.route(message).request.route.data).toEqual(
      '/foo/fizz/baz/buzz'
    );
  });

  test('GET /foo/bar/public honors tailOf API', () => {
    const message: Message = {
      request: { method: 'GET', path: '/foo/bar/public/x/y/z.html' }
    };
    const request = router.route(message).request;
    expect(request.route.data).toEqual('/foo/bar/public');
    expect(router.tailOf(request.path, request.route)).toEqual('/x/y/z.html');
  });

  test('GET /foo/bar/public resolves to root dir from DI', () => {
    const message: Message = {
      request: { method: 'GET', path: '/foo/bar/public/x/y/z.html' }
    };
    const request = router.route(message).request;
    expect(request.route.data).toEqual('/foo/bar/public');
    const handler = Handler.makeInstance<FileServer>(request.route);
    expect(handler instanceof FileServer).toBeTruthy();
    expect(handler['opts']['root']).toEqual('/tmp');
  });
});
