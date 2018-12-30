import { Attr } from './metadata';
import { Metadata } from './interfaces';

import { getMetadata } from './metadata';

describe('Decorator unit tests', () => {

  test('smoke test #1', () => {
    class Y {
      @Attr() a: number;
      @Attr() b: string;
    }   
    const metadata: Metadata[] = getMetadata(Y);
    expect(metadata.length).toEqual(2);
    expect(metadata[0].name).toEqual('a');
    expect(metadata[0].type).toEqual('Number');
    expect(metadata[1].name).toEqual('b');
    expect(metadata[1].type).toEqual('String');
  });

});
