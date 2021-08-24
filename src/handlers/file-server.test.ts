import { FileServer } from './file-server';
import { Message } from '../interfaces';
import { Route } from '../interfaces';
import { Router } from '../router';

import * as fs from 'fs';
import * as path from 'path';

import { of } from 'rxjs';

const routes: Route[] = [
  {
    path: '/public',
    handler: FileServer
  }
];

const info = { title: 'dummy', version: 'dummy' };
const router = new Router(routes);
const fileServer = new FileServer({ root: __dirname });

describe('FileServer unit tests', () => {
  test('sets statusCode, body and headers if found', (done) => {
    const stat = fs.statSync(path.join(__dirname, 'file-server.test.ts'));
    const message: Message = {
      context: { info, router },
      request: {
        path: '/public/file-server.test.ts',
        method: 'GET',
        headers: {},
        route: routes[0]
      },
      response: { headers: {} }
    };
    fileServer.handle(of(message)).subscribe(({ response }) => {
      expect(response.body.toString()).toMatch(/^import /);
      expect(response.headers['Cache-Control']).toEqual(
        'must-revalidate, max-age=31557600'
      );
      expect(Number(response.headers['Etag'])).toEqual(stat.mtime.getTime());
      expect(response.statusCode).toEqual(200);
      done();
    });
  });

  test('sets statusCode and headers if found but cached', (done) => {
    const stat = fs.statSync(path.join(__dirname, 'file-server.test.ts'));
    const message: Message = {
      context: { info, router },
      request: {
        path: '/public/file-server.test.ts',
        method: 'GET',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'If-None-Match': String(stat.mtime.getTime()) },
        route: routes[0]
      },
      response: { headers: {} }
    };
    fileServer.handle(of(message)).subscribe(({ response }) => {
      expect(response.body).toBeUndefined();
      expect(response.headers['Cache-Control']).toEqual(
        'must-revalidate, max-age=31557600'
      );
      expect(Number(response.headers['Etag'])).toEqual(stat.mtime.getTime());
      expect(response.statusCode).toEqual(304);
      done();
    });
  });

  test('sets statusCode if not found', (done) => {
    const message: Message = {
      context: { info, router },
      request: {
        path: '/public/x/y/z.html',
        method: 'GET',
        headers: {},
        route: routes[0]
      },
      response: { headers: {} }
    };
    fileServer.handle(of(message)).subscribe({
      error: ({ exception }) => {
        expect(exception.statusCode).toEqual(404);
        done();
      }
    });
  });
});
