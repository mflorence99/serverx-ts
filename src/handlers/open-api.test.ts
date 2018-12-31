import { InfoObject } from 'openapi3-ts';
import { OpenAPI } from './open-api';
import { Route } from '../interfaces';
import { Router } from '../router';

const info: InfoObject = {
  title: 'open-api.test',
  version: '0.0.0'
};

const routes: Route[] = [

  {
    path: ''
  }

];


describe('OpenAPI unit tests', () => {

  test('smoke test #1', () => {
    const router = new Router(routes);
    const flattened = router.flatten();
    const openAPI = OpenAPI.fromRoutes(info, flattened).getSpec();
    expect(openAPI.info.title).toEqual('open-api.test');
    expect(openAPI.info.version).toEqual('0.0.0');
  });

});
