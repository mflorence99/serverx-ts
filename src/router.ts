import 'reflect-metadata';

import { CatchAll } from './catchers/catch-all';
import { Class } from './serverx';
import { LogProvider } from './services/log-provider';
import { Map } from './serverx';
import { Message } from './serverx';
import { Method } from './serverx';
import { NotFound } from './handlers/not-found';
import { RedirectTo } from './handlers/redirect-to';
import { ReflectiveInjector } from 'injection-js';
import { Route } from './serverx';
import { StatusCode200 } from './handlers/statuscode-200';

/**
 * Router implementation
 */

export class Router {

  routes: Route[];

  /** ctor */
  constructor(routes: Route[],
              required: Class[] = []) { 
    this.routes = [{
      path: '',
      middlewares: required,
      catcher: CatchAll,
      services: [LogProvider],
      children: routes,
      phantom: true
    }];
  }

  /** Route a message */
  route(message: Message): Message {
    const { request } = message;
    const params = { };
    const paths = this.split(request.path);
    const route = this.match(paths, request.method, null, this.routes, params);
    request.params = params;
    request.route = route;
    return message;
  }

  // private methods

  private match(paths: string[],
                method: Method,
                parent: Route,
                routes: Route[],
                params: Map<string>): Route | undefined {
    const rpaths = [];
    // find matching route, fabricating if necessary
    let route = this.matchImpl(paths, rpaths, method, parent, routes, params);
    // we always need a handler
    if (!route.handler) 
      route.handler = route.redirectTo? RedirectTo : StatusCode200;
    // create an injector
    if (!route.injector) {
      const providers = (route.services || []).concat(route.middlewares || []);
      providers.push(route.handler);
      if (route.catcher)
        providers.push(route.catcher);
      const resolved = ReflectiveInjector.resolve(providers);
      if (parent)
        route.injector = parent.injector.createChildFromResolved(resolved);
      else route.injector = ReflectiveInjector.fromResolvedProviders(resolved);
    }
    // look to the children
    if (route.children && (paths.length > rpaths.length))
      route = this.match(paths.slice(rpaths.length), method, route, route.children, params);
    return route;
  }

  private matchImpl(paths: string[],
                    rpaths: string[],
                    method: Method,
                    parent: Route,
                    routes: Route[],
                    params: Map<string>): Route {
    let route = routes.find((route: Route) => {
      route.parent = parent;
      if (route.methods && !route.methods.includes(method))
        return false;
      if (route.path === '**')
        return true;
      rpaths.splice(0, rpaths.length, ...this.split(route.path));
      if (rpaths.length === 0)
        return true;
      if ((rpaths.length > paths.length)
        || ((route.pathMatch === 'full') && (rpaths.length !== paths.length)))
        return false;
      return rpaths.every((rpath, ix) => rpath.startsWith(':') || (rpath === paths[ix]));
    });
    // if no route, fabricate a catch all
    // NOTE: we only want to do this once per not found
    if (!route) {
      route = { handler: NotFound, parent, path: '**', phantom: true };
      routes.push(route);
    }
    // accumulate path parameters
    rpaths.forEach((rpath, ix) => {
      if (rpath.startsWith(':'))
        params[rpath.substring(1)] = paths[ix];
    });
    return route;
  }

  private split(path: string): string[] {
    // NOTE: trim out any leading or trailing /
    return (path && (path !== '/'))? path.replace(/^\/|\/$/g, '').split('/') : [];
  }

}
