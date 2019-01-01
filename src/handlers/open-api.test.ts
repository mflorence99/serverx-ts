import { Attr } from '../metadata';
import { InfoObject } from 'openapi3-ts';
import { OpenAPI } from './open-api';
import { OperationObject } from 'openapi3-ts';
import { Route } from '../interfaces';
import { Router } from '../router';

const info: InfoObject = {
  title: 'open-api.test',
  version: '0.0.0'
};

class CommonHeader {
  @Attr() x: string;
  @Attr() y: boolean;
  @Attr() z: number;
}

class FooPath {
  @Attr() k: boolean;
}

class FooQuery {
  @Attr({ required: false }) k: number;
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
        path: '/foo'
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

  test('request parameter metadata is recorded', () => {
    const op: OperationObject = openAPI.paths['/foo'].get;
    expect(op.parameters).toContainEqual({ name: 'x', in: 'header', required: true,
      schema: { type: 'String' } });
    expect(op.parameters).toContainEqual({ name: 'y', in: 'header', required: true,
      schema: { type: 'Boolean' } });
    expect(op.parameters).toContainEqual({ name: 'z', in: 'header', required: true,
      schema: { type: 'Number' } });
    expect(op.parameters).toContainEqual({ name: 'k', in: 'path', required: true,
      schema: { type: 'Boolean' } });
    expect(op.parameters).toContainEqual({ name: 'k', in: 'query', required: false, 
      schema: { type: 'Number' } });
  });

});
