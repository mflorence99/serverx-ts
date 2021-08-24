import { BodyParser } from './body-parser';
import { Message } from '../interfaces';

import { fromReadableStream } from '../utils';

import { of } from 'rxjs';

import str = require('string-to-stream');

describe('BodyParser unit tests', () => {
  test('parses JSON', (done) => {
    const bodyParser = new BodyParser(null);
    const body = JSON.stringify({ x: 'y' });
    const message: Message = {
      request: {
        path: '/foo/bar',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        stream$: fromReadableStream(str(body))
      }
    };
    bodyParser.prehandle(of(message)).subscribe(({ request }) => {
      expect(request.body.x).toEqual('y');
      done();
    });
  });

  test('parses form encoded', (done) => {
    const bodyParser = new BodyParser(null);
    const body = encodeURIComponent('a=b&x=y');
    const message: Message = {
      request: {
        path: '/foo/bar',
        method: 'POST',
        headers: { 'content-type': 'x-www-form-urlencoded' },
        stream$: fromReadableStream(str(body))
      }
    };
    bodyParser.prehandle(of(message)).subscribe(({ request }) => {
      expect(request.body.a).toEqual('b');
      expect(request.body.x).toEqual('y');
      done();
    });
  });

  test('nothing to parse', (done) => {
    const bodyParser = new BodyParser(null);
    const message: Message = {
      request: {
        path: '/foo/bar',
        method: 'POST',
        headers: { 'content-type': 'x-www-form-urlencoded' },
        stream$: null
      }
    };
    bodyParser.prehandle(of(message)).subscribe(({ request }) => {
      expect(request.body).toBeUndefined();
      done();
    });
  });
});
