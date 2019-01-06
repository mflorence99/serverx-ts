import { Class } from '../interfaces';
import { ContentObject } from 'openapi3-ts';
import { Handler } from '../handler';
import { InfoObject } from 'openapi3-ts';
import { Injectable } from 'injection-js';
import { Message } from '../interfaces';
import { Metadata } from '../interfaces';
import { Observable } from 'rxjs';
import { OpenApiBuilder } from 'openapi3-ts';
import { OperationObject } from 'openapi3-ts';
import { ParameterLocation } from 'openapi3-ts';
import { PathItemObject } from 'openapi3-ts';
import { PathsObject } from 'openapi3-ts';
import { Route } from '../interfaces';
import { SchemaObject } from 'openapi3-ts';

import { getMetadata } from '../metadata';
import { resolveMetadata } from '../metadata';
import { tap } from 'rxjs/operators';

/**
 * OpenAPI YML generator
 */

@Injectable() export class OpenAPI extends Handler {

  /**
   * Generate OpenAPI from routes
   * 
   * TODO: refactor if it gets any bigger
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
          .map(([contentType, clazz]) => ({ contentType, schema: OpenAPI.makeSchemaObject(clazz) }))
          .reduce((acc, { contentType, schema }) => {
            acc[contentType] = { schema };
            return acc;
          }, { });
        operation.requestBody = { content };
      }
      // handle request parameters
      if (route.request) {
        ['header', 'path', 'query']
          .map(type => ({ type, clazz: route.request[type] }))
          .filter(({ type, clazz }) => !!clazz)
          .map(({ type, clazz }) => ({ type, metadata: getMetadata(clazz) }))
          .forEach(({ type, metadata }) => {
            metadata.forEach(metadatum => {
              operation.parameters.push({ 
                name: metadatum.name, 
                in: type as ParameterLocation, 
                // NOTE: path params are always required
                required: metadatum.opts.required || (type === 'path'),
                schema: { type: OpenAPI.typeFor(metadatum) } 
              });
            });
          });
      }
      // handle responses
      if (route.responses) {
        Object.keys(route.responses).forEach(statusCode => {
          const content: ContentObject = Object.entries(route.responses[statusCode])
            .map(([contentType, clazz]) => ({ contentType, schema: OpenAPI.makeSchemaObject(clazz) }))
            .reduce((acc, { contentType, schema }) => {
              acc[contentType] = { schema };
              return acc;
            }, { });
          operation.responses[statusCode] = { content };
        });
      }
      // redirect gets a special response
      if (route.redirectTo) {
        const statusCode = route.redirectAs || 301;
        operation.responses[String(statusCode)] = { headers: { 'Location': { schema: { type: 'string' } } } };
      }
      // NOTE: we allow multiple methods to alias to the same "operation"
      // while OpenAPI does not directly, so this looks a little weird
      route.methods.forEach(method => item[method.toLowerCase()] = operation);
      acc[route.path] = item;
      return acc;
    }, { } as PathsObject);
    // add the paths back into the OpenAPI object
    Object.entries(paths).forEach(([pathName, path]) => openAPI.addPath(pathName, path));
    return openAPI;
  }

  /**
   * Make an OpenAPI schema from a class's metadata
   * 
   * @see https://swagger.io/docs/specification/data-models/data-types
   */

  static makeSchemaObject(tgt: Class): SchemaObject {
    const metadata = resolveMetadata(getMetadata(tgt));
    const schema: SchemaObject = {
      properties: { },
      required: [],
      type: 'object'
    };
    return OpenAPI.makeSchemaObjectImpl(metadata, schema);
  }

  private static makeSchemaObjectImpl(metadata: Metadata[],
                                      schema: SchemaObject): SchemaObject {
    metadata.forEach(metadatum => {
      // this is the normal case - we keep coded properties to a minimum
      const subschema: SchemaObject = { type: OpenAPI.typeFor(metadatum) };
      // for arrays
      if (metadatum.isArray) {
        subschema.items = { type: OpenAPI.typeFor(metadatum)  };
        subschema.type = 'array';
        // for arrays of objects
        if (metadatum.metadata.length > 0) {
          subschema.items.properties = { };
          subschema.items.required = [];
          subschema.items.type = 'object';
          OpenAPI.makeSchemaObjectImpl(metadatum.metadata, subschema.items);
        }
      }
      // for objects 
      else if (metadatum.metadata.length > 0) {
        subschema.properties = { };
        subschema.required = [];
        subschema.type = 'object';
        OpenAPI.makeSchemaObjectImpl(metadatum.metadata, subschema);
      }
      schema.properties[metadatum.name] = subschema;
      if (metadatum.opts.required)
        schema.required.push(metadatum.name);
    });
    return schema;
  }

  private static typeFor(metadata: Metadata): string {
    if (metadata.type === 'Number')
      return metadata.opts.float? 'number' : 'integer';
    else return metadata.type.toLowerCase();
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
