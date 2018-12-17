import { Handler } from './handler';
import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';
import { Request } from './http';
import { Route } from './router';
import { Router } from './router';

@Injectable()
class Service2 {
  then = Date.now();
}

@Injectable()
class Service1 {
  now = Date.now();
  constructor(public service: Service2) { }
}

@Injectable()
class Handler1 implements Handler {
  constructor(public service: Service1) { }
  handle(request$: Observable<Request>): void { }
}

const routes: Route[] = [

  {
    path: '/foo',
    services: [Service1, Service2],
    children: [

      {
        methods: ['GET'],
        path: '/bar',
        data: '/foo/bar',
        children: [

          {
            path: '/this/:id/:user',
            handler: Handler1,
            data: '/foo/bar/this/:id/:user'
          },

          {
            path: '/that/:partner',
            handler: Handler1,
            data: '/foo/bar/that/:partner'
          },

        ]
      },

      {
        methods: ['GET'],
        path: '/fizz/baz',
        data: '/foo/fizz/baz'
      },

      {
        methods: ['POST'],
        path: '/fizz/baz',
        pathMatch: 'full'
      }

    ]
  }

];

const router = new Router(routes);

test('GET / no match', () => {
  const request: Request = { method: 'GET', path: '/' };
  expect(router.route(request)).toBeUndefined();
});

test('GET /foo/bar matches', () => {
  const request: Request = { method: 'GET', path: '/foo/bar' };
  expect(router.route(request).data).toEqual('/foo/bar');
});

test('GET /foo/bar/this no match', () => {
  const request: Request = { method: 'GET', path: '/foo/bar/this' };
  expect(router.route(request)).toBeUndefined();
});

test('GET /foo/bar/this/10/mark matches', () => {
  const request: Request = { method: 'GET', path: '/foo/bar/this/10/mark' };
  const route = router.route(request);
  expect(route.data).toEqual('/foo/bar/this/:id/:user');
  const handler = route.injector.get(route.handler);
  expect(handler instanceof Handler1).toBeTruthy();
  expect(handler.service instanceof Service1).toBeTruthy();
  expect(handler.service.service instanceof Service2).toBeTruthy();
  expect(request.params).toEqual({ id: '10', user: 'mark' });
});

test('GET /foo/bar/that/10/company matches', () => {
  const request: Request = { method: 'GET', path: '/foo/bar/that/company' };
  expect(router.route(request).data).toEqual('/foo/bar/that/:partner');
  expect(request.params).toEqual({ partner: 'company' });
});

test('GET /foo/fizz/baz/x matches', () => {
  const request: Request = { method: 'GET', path: '/foo/fizz/baz/' };
  expect(router.route(request).data).toEqual('/foo/fizz/baz');
});

test('POST /foo/fizz/baz/full no match', () => {
  const request: Request = { method: 'POST', path: '/foo/fizz/baz/full' };
  expect(router.route(request)).toBeUndefined();
});
