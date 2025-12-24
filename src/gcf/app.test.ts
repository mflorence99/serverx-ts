import { GCFApp } from './app';
import { Handler } from '../handler';
import { Message } from '../interfaces';
import { Middleware } from '../middleware';
import { Route } from '../interfaces';

import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';

import { tap } from 'rxjs/operators';

@Injectable()
class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.body = `Hello, ${request.query.get('bizz')}`;
      })
    );
  }
}

@Injectable()
class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.body = `Goodbye, ${request.query.get('buzz')}`;
      })
    );
  }
}

@Injectable()
class Explode extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response['x']['y'] = 'z';
      })
    );
  }
}

@Injectable()
class Middleware1 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.headers['X-this'] = 'that';
      })
    );
  }
}

@Injectable()
class Middleware2 extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ request, response }) => {
        response.headers['X-that'] = 'this';
        Object.keys(request.body).forEach(
          (k) => (response.headers[k] = request.body[k])
        );
      })
    );
  }
}
const req: any = {
  body: { a: 'b', c: 'd' },
  headers: {
    this: 'that'
  },
  method: 'GET',
  url: '/foo/bar?bizz=bazz&buzz=bozz'
};

const res: any = {};

const routes: Route[] = [
  {
    path: '',
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
      },

      {
        methods: ['GET'],
        path: '/explode',
        handler: Explode
      },

      {
        methods: ['GET'],
        path: '/not-here',
        redirectTo: 'http://over-there.com'
      }
    ]
  }
];

const app = new GCFApp(routes);

describe('GCFApp unit tests', () => {
  test('smoke test #1', async () => {
    const response = await app.handle({ ...req, method: 'GET' }, res);
    expect(response.body).toEqual('"Hello, bazz"');
    expect(response.headers['X-this']).toEqual('that');
    expect(response.headers['X-that']).toEqual('this');
    expect(response.headers['a']).toEqual('b');
    expect(response.headers['c']).toEqual('d');
    expect(response.statusCode).toEqual(200);
  });

  test('smoke test #2', async () => {
    const response = await app.handle({ ...req, method: 'PUT' }, res);
    expect(response.body).toEqual('"Goodbye, bozz"');
    expect(response.headers['X-this']).toEqual('that');
    expect(response.headers['X-that']).toBeUndefined();
    expect(response.statusCode).toEqual(200);
  });

  test('smoke test #3', async () => {
    const response = await app.handle(
      { ...req, method: 'PUT', url: '/xxx' },
      res
    );
    expect(response.statusCode).toEqual(404);
  });

  test('smoke test #4', async () => {
    const response = await app.handle(
      { ...req, method: 'GET', url: '/not-here' },
      res
    );
    expect(response.headers['Location']).toEqual('http://over-there.com');
    expect(response.statusCode).toEqual(301);
  });

  test('error 500', async () => {
    const response = await app.handle(
      { ...req, method: 'GET', url: '/explode' },
      res
    );
    expect(response.body).toContain(
      `TypeError: Cannot set properties of undefined`
    );
    expect(response.statusCode).toEqual(500);
  });
});
