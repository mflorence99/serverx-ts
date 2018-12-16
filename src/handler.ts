import { Class } from './utils';
import { Observable } from 'rxjs';
import { ReflectiveInjector } from 'injection-js';
import { Request } from './http';

import 'reflect-metadata';

/**
 * Handler base class
 */

export abstract class Handler {

  static makeInstance(clazz: Class, 
                      providers: Class[] = []): any {
    const resolved = ReflectiveInjector.resolve([clazz].concat(providers));
    const injector = ReflectiveInjector.fromResolvedProviders(resolved);
    return injector.get(clazz);
  }

  /** Handle a request */
  abstract handle(request$: Observable<Request>): void;

}
