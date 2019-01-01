import { Attr } from './metadata';
import { Metadata } from './interfaces';
import { SchemaObject } from 'openapi3-ts';

import { getMetadata } from './metadata';
import { makeSchemaObject } from './metadata';
import { resolveMetadata } from './metadata';

describe('Decorator unit tests', () => {

  test('primitive types', () => {
    class Y {
      @Attr() a: number;
      @Attr() b: string;
      @Attr() c: boolean;
    }   
    const metadata: Metadata[] = getMetadata(Y);
    expect(metadata.length).toEqual(3);
    expect(metadata[0].name).toEqual('a');
    expect(metadata[0].type).toEqual('Number');
    expect(metadata[1].name).toEqual('b');
    expect(metadata[1].type).toEqual('String');
    expect(metadata[2].name).toEqual('c');
    expect(metadata[2].type).toEqual('Boolean');
  });

  test('object types', () => {
    class X {
      @Attr() t: number;
    }
    class Y {
      @Attr() b: X;
      @Attr() c: string;
    }
    class Z {
      @Attr() a: Y;
    }
    let metadata: Metadata[] = getMetadata(Z);
    resolveMetadata(metadata);
    expect(metadata.length).toEqual(1);
    expect(metadata[0].name).toEqual('a');
    expect(metadata[0].type).toEqual('Y');
    metadata = metadata[0].metadata;
    expect(metadata.length).toEqual(2);
    expect(metadata[0].name).toEqual('b');
    expect(metadata[0].type).toEqual('X');
    expect(metadata[1].name).toEqual('c');
    expect(metadata[1].type).toEqual('String');
    metadata = metadata[0].metadata;
    expect(metadata.length).toEqual(1);
    expect(metadata[0].name).toEqual('t');
    expect(metadata[0].type).toEqual('Number');
  });

  test('object types', () => {
    class X {
      @Attr() t: number;
    }
    class Y {
      @Attr() b: X;
      @Attr() c: string;
    }
    class Z {
      @Attr() a: Y;
    }
    const schema: SchemaObject = makeSchemaObject(Z);
    expect(schema.properties['a']['type']).toEqual('object');
    expect(schema.properties['a']['properties']['b']['type']).toEqual('object');
    expect(schema.properties['a']['properties']['b']['properties']['t']['type']).toEqual('number');
    expect(schema.properties['a']['properties']['c']['type']).toEqual('string');
  });

});
