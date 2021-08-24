import { BinaryTyper } from './binary-typer';
import { Message } from '../interfaces';

import { of } from 'rxjs';

describe('BinaryTyper unit tests', () => {
  test('response with Content-Encoding is always binary', (done) => {
    const binaryTyper = new BinaryTyper(null);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      response: {
        body: Buffer.from('a'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Encoding': 'gzip' }
      }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.isBase64Encoded).toBeTruthy();
      done();
    });
  });

  test('default binary types match any Content-Type', (done) => {
    const binaryTyper = new BinaryTyper(null);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      response: {
        body: Buffer.from('a'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'text/html' }
      }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.isBase64Encoded).toBeTruthy();
      done();
    });
  });

  test('wildcard binary types match Content-Type', (done) => {
    const binaryTyper = new BinaryTyper([
      'application/*',
      'this/that',
      '*/binary'
    ]);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      response: {
        body: Buffer.from('a'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'text/binary' }
      }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.isBase64Encoded).toBeTruthy();
      done();
    });
  });

  test('explicit binary types match Content-Type', (done) => {
    const binaryTyper = new BinaryTyper([
      'application/*',
      'this/that',
      '*/binary'
    ]);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      response: {
        body: Buffer.from('a'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'this/that' }
      }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.isBase64Encoded).toBeTruthy();
      done();
    });
  });

  test('no binary types match Content-Type is never binary', (done) => {
    const binaryTyper = new BinaryTyper([
      'application/*',
      'this/that',
      '*/binary'
    ]);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      response: {
        body: Buffer.from('a'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'text/that' }
      }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.isBase64Encoded).toBeFalsy();
      done();
    });
  });

  test('empty binary types is never binary', (done) => {
    const binaryTyper = new BinaryTyper([]);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      response: {
        body: Buffer.from('a'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'text/that' }
      }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.isBase64Encoded).toBeFalsy();
      done();
    });
  });

  test('response body not-a-Buffer is analyzed as if a buffer', (done) => {
    const binaryTyper = new BinaryTyper(null);
    const message: Message = {
      request: { path: '/', method: 'GET' },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response: { body: 'a', headers: { 'Content-Encoding': 'gzip' } }
    };
    binaryTyper.postcatch(of(message)).subscribe(({ response }) => {
      expect(response.body instanceof Buffer).toBeTruthy();
      expect(response.isBase64Encoded).toBeTruthy();
      done();
    });
  });
});
