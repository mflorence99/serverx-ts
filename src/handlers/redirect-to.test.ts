import { Message } from '../interfaces';
import { RedirectTo } from './redirect-to';

import { of } from 'rxjs';

describe('RedirectTo unit tests', () => {

  test('sets statusCode and headers', done => {
    const redirectTo = new RedirectTo();
    const message: Message = {
      request: { path: '/foo/bar', method: 'GET', route: { path: 'x', redirectTo: 'y' } },
      response: { headers: { } }
    };
    redirectTo.handle(of(message))
      .subscribe(message => {
        const { response } = message;
        expect(response.headers['Location']).toEqual('y');
        expect(response.statusCode).toEqual(301);
        done();
      });
  });

});
