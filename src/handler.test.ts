import { Handler } from './handler';
import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';
import { Request } from './http';

@Injectable()
class Service2 {
  then = Date.now();
}

@Injectable()
class Service { 
  now = Date.now();
  constructor(service: Service2) { }
}

@Injectable()
class MyHandler implements Handler {
  constructor(private service: Service) { }
  handle(request$: Observable<Request>): void { }
}

test('xxx', () => {
  const h1: MyHandler = Handler.makeInstance(MyHandler, [Service, Service2]);
  expect(h1 instanceof MyHandler).toBeTruthy();
  expect(h1['service'] instanceof Service).toBeTruthy();
  const h2: MyHandler = Handler.makeInstance(MyHandler, [Service, Service2]);
  expect(h2 instanceof MyHandler).toBeTruthy();
  expect(h2['service'] instanceof Service).toBeTruthy();
  expect(h1).toBe(h2);
  expect(h1['service']).toBe(h2['service']);
  expect(h1['service']).toEqual(h2['service']);
});
