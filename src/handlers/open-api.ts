import { Handler } from '../handler';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Observable } from 'rxjs';
import { OpenApiBuilder } from 'openapi3-ts';
import { OperationObject } from 'openapi3-ts';
import { PathItemObject } from 'openapi3-ts';
import { PathsObject } from 'openapi3-ts';

import { tap } from 'rxjs/operators';

/**
 * OpenAPI YML generator
 */

@Injectable() export class OpenAPI extends Handler {

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { context, response } = message;
        // TODO: temporary
        const openAPI = new OpenApiBuilder();
        openAPI.addInfo(context.info);
        // add each path
        const flattened = context.router.flatten();
        const paths = flattened.reduce((acc, route) => {
          const item: PathItemObject = acc[route.path] || { };
          const operation: OperationObject = { 
            description: route.description || '',
            responses: { },
            summary: route.summary || ''
          };
          route.methods.forEach(method => item[method.toLowerCase()] = operation);
          acc[route.path] = item;
          return acc;
        }, { } as PathsObject);
        Object.keys(paths).forEach(path => openAPI.addPath(path, paths[path]));
        // the business
        response.body = openAPI.getSpec();
      })
    );
  }

}
