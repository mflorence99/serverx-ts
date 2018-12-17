import { Class } from './utils';
import { Map } from './utils';
import { Method } from './http';
import { ReflectiveInjector } from 'injection-js';
import { Request } from './http';

import 'reflect-metadata';

/**
 * Route definition
 */

export interface Route {
  children?: Route[];
  data?: any;
  handler?: Class;
  injector?: ReflectiveInjector;
  methods?: Method[];
  path: string;
  pathMatch?: 'full' | 'prefix';
  services?: Class[];
}

/**
 * Router implementation
 */

export class Router {

  /** ctor */
  constructor(private routes: Route[]) { }

  /** Route a request */
  route(request: Request): Route | undefined {
    const params = { };
    const paths = this.split(request.path);
    const route = this.match(paths, request.method, null, this.routes, params);
    if (route) {
      request.params = params;
    }
    return route;
  }

  // private methods

  private match(paths: string[],
                method: Method,
                parent: Route,
                routes: Route[],
                params: Map<string>): Route | undefined {
    let rpaths = [];
    // try to find matching route
    let route = routes.find((route: Route) => {
      rpaths = this.split(route.path);
      if (rpaths[0] === '**')
        return true;
      if (route.methods && !route.methods.includes(method))
        return false;
      if ((rpaths.length > paths.length)
       || ((route.pathMatch === 'full') && (rpaths.length !== paths.length)))
        return false;
      return rpaths.every((rpath, ix) => rpath.startsWith(':') || (rpath === paths[ix]));
    });
    // if we found a match, create an injector
    if (route && !route.injector) {
      const providers = (route.services || []).slice();
      if (route.handler)
        providers.push(route.handler);
      const resolved = ReflectiveInjector.resolve(providers);
      if (parent)
        route.injector = parent.injector.createChildFromResolved(resolved);
      else route.injector = ReflectiveInjector.fromResolvedProviders(resolved);
    }
    // if we found a match, look to the children
    if (route && route.children && (paths.length > rpaths.length))
      route = this.match(paths.slice(rpaths.length), method, route, route.children, params);
    // if we found a match, accumulate parameters
    if (route) {
      rpaths.forEach((rpath, ix) => {
        if (rpath.startsWith(':'))
          params[rpath.substring(1)] = paths[ix];
      });
    }
    return route;
  }

  private split(path: string): string[] {
    // NOTE: trim out any leading or trailing /
    return path.replace(/^\/|\/$/g, '').split('/');
  }

}