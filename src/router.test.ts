import { Router } from './router';
import { Routes } from './router';

const routes: Routes = [

  {
    method: 'GET',
    path: '/foo/bar'
  },

  {
    method: 'POST',
    path: '/foo/bar/baz'
  },

];

test('route() matches', () => {
  const router = new Router(routes);
  expect(router.route({ method: 'GET', url: '/foo/bar'})).not.toBeUndefined();
  expect(router.route({ method: 'POST', url: '/foo/bar/baz'})).not.toBeUndefined();
  expect(router.route({ method: 'GET', url: '/'})).toBeUndefined();
});
