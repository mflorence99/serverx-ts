import { Attr } from '../metadata';
import { InfoObject } from 'openapi3-ts';
import { OpenAPI } from './open-api';
import { OperationObject } from 'openapi3-ts';
import { Route } from '../interfaces';
import { Router } from '../router';
import { SchemaObject } from 'openapi3-ts';

const info: InfoObject = {
  title: 'open-api.test',
  version: '0.0.0'
};

class CommonHeader {
  @Attr({ required: true }) x: string;
  @Attr() y: boolean;
  @Attr() z: number;
}

class FooBodyInner {
  @Attr() a: number;
  @Attr() b: string;
  @Attr() c: boolean;
}   

class FooBody {
  @Attr() p: string;
  @Attr() q: boolean;
  @Attr() r: number;
  @Attr() t: FooBodyInner;
}

class FooPath {
  @Attr() k: boolean;
}

class FooQuery {
  @Attr({ required: true }) k: number;
}

const routes: Route[] = [

  {
    path: '',
    request: {
      header: CommonHeader
    },
    summary: 'Top level',
    children: [

      {
        description: 'GET /foo',
        methods: ['GET'],
        path: '/foo',
        request: {
          path: FooPath,
          query: FooQuery,
        }
      },

      {
        description: 'PUT /foo',
        methods: ['PUT'],
        path: '/foo',
        request: {
          body: {
            'application/x-www-form-urlencoded': FooBody,
            'application/json': FooBody
          }
        }
      },

      {
        summary: 'Lower level',
        description: 'POST /bar',
        methods: ['POST'],
        path: '/bar'
      }

    ]
  }

];

const router = new Router(routes);
const flattened = router.flatten();
const openAPI = OpenAPI.fromRoutes(info, flattened).getSpec();

describe('OpenAPI unit tests', () => {

  test('basic smoke test', () => {
    expect(openAPI.info.title).toEqual('open-api.test');
    expect(openAPI.info.version).toEqual('0.0.0');
  });

  test('paths and methods are mapped correctly', () => {
    const pathNames = Object.keys(openAPI.paths);
    expect(pathNames.length).toEqual(2);
    // NOTE: flattened paths are alpha-sorted
    expect(pathNames[0]).toEqual('/bar');
    expect(pathNames[1]).toEqual('/foo');
    expect(openAPI.paths['/foo'].get).toBeDefined();
    expect(openAPI.paths['/foo'].put).toBeDefined();
    expect(openAPI.paths['/foo'].post).not.toBeDefined();
    expect(openAPI.paths['/bar'].get).not.toBeDefined();
    expect(openAPI.paths['/bar'].post).toBeDefined();
  });

  test('basic summary and description are accumulated', () => {
    expect(openAPI.paths['/foo'].get.summary).toEqual('Top level');
    expect(openAPI.paths['/foo'].get.description).toEqual('GET /foo');
    expect(openAPI.paths['/foo'].put.summary).toEqual('Top level');
    expect(openAPI.paths['/foo'].put.description).toEqual('PUT /foo');
    expect(openAPI.paths['/bar'].post.summary).toEqual('Lower level');
    expect(openAPI.paths['/bar'].post.description).toEqual('POST /bar');
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
    const schema: SchemaObject = OpenAPI.makeSchemaObject(Z);
    expect(schema.properties['a']['type']).toEqual('object');
    expect(schema.properties['a']['properties']['b']['type']).toEqual('object');
    expect(schema.properties['a']['properties']['b']['properties']['t']['type']).toEqual('number');
    expect(schema.properties['a']['properties']['c']['type']).toEqual('string');
  });

  test('array types', () => {
    class X {
      @Attr() p: string;
      @Attr() q: number;
    }
    class Y {
      @Attr({ _class: X }) t: X[];
    }
    const schema: SchemaObject = OpenAPI.makeSchemaObject(Y);
    expect(schema.properties['t']['type']).toEqual('object');
    expect(schema.properties['t']['properties']['p']['type']).toEqual('string');
    expect(schema.properties['t']['properties']['q']['type']).toEqual('number');
  });

  test('request parameter metadata is recorded', () => {
    const op: OperationObject = openAPI.paths['/foo'].get;
    expect(op.parameters).toContainEqual({ name: 'x', in: 'header', required: true,
      schema: { type: 'string' } });
    expect(op.parameters).toContainEqual({ name: 'y', in: 'header', required: false,
      schema: { type: 'boolean' } });
    expect(op.parameters).toContainEqual({ name: 'z', in: 'header', required: false,
      schema: { type: 'number' } });
    expect(op.parameters).toContainEqual({ name: 'k', in: 'path', required: true,
      schema: { type: 'boolean' } });
    expect(op.parameters).toContainEqual({ name: 'k', in: 'query', required: true, 
      schema: { type: 'number' } });
  });

  test('request body metadata is recorded', () => {
    const schema: SchemaObject = openAPI.paths['/foo'].put.requestBody.content['application/json'].schema;
    expect(schema.properties['p']['type']).toEqual('string');
    expect(schema.properties['q']['type']).toEqual('boolean');
    expect(schema.properties['r']['type']).toEqual('number');
    expect(schema.properties['t']['type']).toEqual('object');
    expect(schema.properties['t']['properties']['a']['type']).toEqual('number');
    expect(schema.properties['t']['properties']['b']['type']).toEqual('string');
    expect(schema.properties['t']['properties']['c']['type']).toEqual('boolean');
  });

});
