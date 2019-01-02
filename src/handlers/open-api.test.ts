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

class BarBody {
  @Attr() p: string;
  @Attr() q: boolean;
  @Attr() r: number;
}

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
        path: '/bar',
        responses: {
          '200': {
            'application/json': BarBody
          }
        },
      }

    ]
  }

];

const router = new Router(routes);
const flattened = router.flatten();
const openAPI = OpenAPI.fromRoutes(info, flattened).getSpec();

describe('OpenAPI unit tests', () => {

  test('object types', () => {
    class X {
      @Attr() t: number;
      @Attr({ float: true }) u: number;
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
    expect(schema.properties['a']['properties']['b']['properties']['t']['type']).toEqual('integer');
    expect(schema.properties['a']['properties']['b']['properties']['u']['type']).toEqual('number');
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
    expect(schema.properties['t']['type']).toEqual('array');
    expect(schema.properties['t']['items']['type']).toEqual('object');
    expect(schema.properties['t']['items']['properties']['p']['type']).toEqual('string');
    expect(schema.properties['t']['items']['properties']['q']['type']).toEqual('integer');
  });

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

  test('request parameter metadata is recorded', () => {
    const op: OperationObject = openAPI.paths['/foo'].get;
    expect(op.parameters).toContainEqual({ name: 'x', in: 'header', required: true,
      schema: { type: 'string' } });
    expect(op.parameters).toContainEqual({ name: 'y', in: 'header', required: false,
      schema: { type: 'boolean' } });
    expect(op.parameters).toContainEqual({ name: 'z', in: 'header', required: false,
      schema: { type: 'integer' } });
    expect(op.parameters).toContainEqual({ name: 'k', in: 'path', required: true,
      schema: { type: 'boolean' } });
    expect(op.parameters).toContainEqual({ name: 'k', in: 'query', required: true, 
      schema: { type: 'integer' } });
  });

  test('request body metadata is recorded', () => {
    const schema: SchemaObject = openAPI.paths['/foo'].put.requestBody.content['application/json'].schema;
    expect(schema.properties['p']['type']).toEqual('string');
    expect(schema.properties['q']['type']).toEqual('boolean');
    expect(schema.properties['r']['type']).toEqual('integer');
    expect(schema.properties['t']['type']).toEqual('object');
    expect(schema.properties['t']['properties']['a']['type']).toEqual('integer');
    expect(schema.properties['t']['properties']['b']['type']).toEqual('string');
    expect(schema.properties['t']['properties']['c']['type']).toEqual('boolean');
  });

  test('response 500 is baked in', () => {
    const schema: SchemaObject = openAPI.paths['/bar'].post.responses['500'].content['application/json'].schema;
    expect(schema.properties['error']['type']).toEqual('string');
    expect(schema.properties['stack']['type']).toEqual('string');
  });

  test('responses can be specified at any level', () => {
    const schema: SchemaObject = openAPI.paths['/bar'].post.responses['200'].content['application/json'].schema;
    expect(schema.properties['p']['type']).toEqual('string');
    expect(schema.properties['q']['type']).toEqual('boolean');
    expect(schema.properties['r']['type']).toEqual('integer');
  });

});
