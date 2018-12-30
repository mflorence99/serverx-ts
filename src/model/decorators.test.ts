import { xxx } from './decorators';

describe('Decorator unit tests', () => {

  test('smoke test #1', () => {
    class Y {
      @xxx() a: number;
      @xxx() b: string;
    }   
    const columns: string[] = Reflect.getMetadata('xxx', Y);
    expect(columns).toEqual([['a', 'Number'], ['b', 'String']]);
  });

});
