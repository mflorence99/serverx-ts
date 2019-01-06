import { caseInsensitiveObject } from './utils';
import { fromReadableStream } from './utils';
import { map } from 'rxjs/operators';

import str = require('string-to-stream');

describe('caseInsensitiveObject unit tests', () => {

  test('HTTP header case is honored', () => {
    const headers = caseInsensitiveObject({ });
    headers['content-TYPE'] = 'application/json';
    headers['cONtent-lENGTH'] = '0';
    expect(Object.keys(headers)).toEqual(['Content-Type', 'Content-Length']);
    expect(headers['Content-Type']).toEqual('application/json');
    expect(headers['Content-Length']).toEqual('0');
  });

  test('HTTP aliases re discarded', () => {
    const headers = caseInsensitiveObject({});
    headers['content-length'] = '10';
    headers['cONtent-lENGTH'] = '0';
    expect(Object.keys(headers)).toEqual(['Content-Length']);
    expect(headers['Content-Length']).toEqual('0');
  });

  test('HTTP Referrer header is properly aliased', () => {
    const headers = caseInsensitiveObject({});
    headers['reFeRRer'] = 'p';
    headers['Referer'] = 'q';
    expect(Object.keys(headers)).toEqual(['Referrer']);
    expect(headers['Referrer']).toEqual('q');
  });

  test('keys can be deleted', () => {
    const headers = caseInsensitiveObject({});
    headers['abc-def'] = 'p';
    headers['ABC-DEF'] = 'q';
    headers['pQr-StU'] = 'q';
    delete headers['PQR-stu'];
    expect(Object.keys(headers)).toEqual(['Abc-Def']);
    expect(headers['Abc-Def']).toEqual('q');
  });

});

describe('fromReadableStream unit tests', () => {

  test('a string can be read as an observable stream', done => {
    const test = 'This is only a test. There is no cause for alarm!';
    const stream$ = fromReadableStream(str(test));
    stream$.pipe(map((result: Buffer): string => result.toString()))
      .subscribe((result: string) => {
        expect(result).toEqual(test);
        done();
      });
  });

});

