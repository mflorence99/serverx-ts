import { ContentObject } from 'openapi3-ts';
import { Handler } from '../handler';
import { InfoObject } from 'openapi3-ts';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Observable } from 'rxjs';
import { OpenApiBuilder } from 'openapi3-ts';
import { OperationObject } from 'openapi3-ts';
import { ParameterLocation } from 'openapi3-ts';
import { PathItemObject } from 'openapi3-ts';
import { PathsObject } from 'openapi3-ts';
import { Route } from '../interfaces';

import { getMetadata } from '../metadata';
import { makeSchemaObject } from '../metadata';
import { tap } from 'rxjs/operators';

/**
 * OpenAPI YML generator
 */

@Injectable() export class OpenAPI extends Handler {

  /**
   * Generate OpenAPI from routes
   * 
   * TODO: very temporary
   */

  static fromRoutes(info: InfoObject, 
                    flattened: Route[]): OpenApiBuilder {
    const openAPI = new OpenApiBuilder().addInfo(info);
    // create each path from a corresponding route
    const paths = flattened.reduce((acc, route) => {
      const item: PathItemObject = acc[route.path] || { };

      // skeleton operation object
      const operation: OperationObject = {
        description: route.description || '',
        responses: { },
        summary: route.summary || '',
        parameters: []
      };

      // handle request body
      if (route.request && route.request.body) {
        const content: ContentObject = Object.entries(route.request.body)
          .map(([mimeType, clazz]) => ({ mimeType, schema: makeSchemaObject(clazz) }))
          .reduce((acc, { mimeType, schema }) => {
            acc[mimeType] = { schema };
            return acc;
          }, { });
        operation.requestBody = { content };
      }

      // handle request parameters
      ['header', 'path', 'query']
        .map(type => ({ type, clazz: route.request? route.request[type] : null }))
        .filter(({ type, clazz }) => !!clazz)
        .map(({ type, clazz }) => ({ type, metadata: getMetadata(clazz) }))
        .forEach(({ type, metadata }) => {
          metadata.forEach(metadatum => {
            operation.parameters.push({ 
              name: metadatum.name, 
              in: type as ParameterLocation, 
              // NOTE: path params are always required
              required: metadatum.opts.required || (type === 'path'),
              schema: { type: metadatum.type.toLowerCase() } 
            });
          });
        });

      // NOTE: we allow multiple methods to alias to the same "operation"
      // while OpenAPI does not direcrly, so this look a little weird
      route.methods.forEach(method => item[method.toLowerCase()] = operation);
      acc[route.path] = item;
      return acc;

    }, { } as PathsObject);
    // add the paths back into the OpenAPI object
    Object.keys(paths).forEach(path => openAPI.addPath(path, paths[path]));
    return openAPI;
  }

  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ context, response } ) => {
        const flattened = context.router.flatten();
        response.body = OpenAPI.fromRoutes(context.info, flattened).getSpec();
      })
    );
  }

}
