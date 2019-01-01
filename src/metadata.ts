import { Class } from './interfaces';
import { Metadata } from './interfaces';
import { MetadataOpts } from './interfaces';
import { SchemaObject } from 'openapi3-ts';

/**
 * Decorators for OpenAPI annotation
 * 
 * @see https://blog.wizardsoftheweb.pro/typescript-decorators-property-decorators/
 */

const METADATA = Symbol('METADATA');

const DEFAULT_OPTS: MetadataOpts = {
  required: false
};

/**
 * Define an attribute (parameter, body etc)
 */

export function Attr(opts: MetadataOpts = DEFAULT_OPTS): any {

  return function(tgt: any, name: string): void {
    const attrs: Metadata[] = Reflect.getMetadata(METADATA, tgt.constructor) || [];
    const _class = Reflect.getMetadata('design:type', tgt, name);
    const type = _class.name;
    attrs.push({ metadata: [], name, type, opts, _class });
    Reflect.defineMetadata(METADATA, attrs, tgt.constructor);
  };

}

/**
 * Get all metadata for a class
 */

export function getMetadata(tgt: Class): Metadata[] {
  return [...Reflect.getMetadata(METADATA, tgt)];
}

export function makeSchemaObject(tgt: Class): SchemaObject {
  const metadata = resolveMetadata(getMetadata(tgt));
  const schema: SchemaObject = {
    properties: { },
    required: [],
    type: 'object'
  };
  return makeSchemaObjectImpl(metadata, schema);
}

function makeSchemaObjectImpl(metadata: Metadata[],
                              schema: SchemaObject): SchemaObject {
  metadata.forEach(metadatum => {
    const subschema: SchemaObject = { type: metadatum.type.toLowerCase() };
    // NOTE: we don't want these properties on the object unless we have to
    if (metadatum.metadata.length > 0) {
      subschema.properties = { };
      subschema.required = [ ];
      subschema.type = 'object';
      makeSchemaObjectImpl(metadatum.metadata, subschema);
    }
    schema.properties[metadatum.name] = subschema;
    if (metadatum.opts.required)
      schema.required.push(metadatum.name);
  });
  return schema;
}

export function resolveMetadata(metadata: Metadata[]): Metadata[] {
  metadata.forEach(metadatum => {
    if (!['Boolean', 'Number', 'String'].includes(metadatum.type))
      metadatum.metadata = resolveMetadata(getMetadata(metadatum._class));
  });
  return metadata;
}
