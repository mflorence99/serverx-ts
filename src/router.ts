import { Handler } from './handler';
import { Request } from './http';

/**
 * Route definition
 */

export interface Route {
  children?: Routes;
  handler?: Handler;
  method: string;
  path: string;
}

export type Routes = Route[];

/**
 * Router implementation
 */

export class Router {

  /** ctor */
  constructor(public readonly routes: Routes) { }

  /** Route a request */
  route(request: Request): Route | undefined {
    return this.routes.find((route: Route) => {
      return (route.method === request.method) && (route.path === request.url);
    });
  }

}
