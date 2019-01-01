import { Class } from './interfaces';
import { Metadata } from './interfaces';
import { MetadataOpts } from './interfaces';

/**
 * Decorators for OpenAPI annotation
 * 
 * @see https://blog.wizardsoftheweb.pro/typescript-decorators-property-decorators/
 */

const METADATA = Symbol('METADATA');

const DEFAULT_OPTS: MetadataOpts = {
  required: true
};

/**
 * Define an attribute (parameter, body etc)
 */

export function Attr(opts: MetadataOpts = DEFAULT_OPTS): any {

  return function(tgt: any, name: string): void {
    const attrs: Metadata[] = Reflect.getMetadata(METADATA, tgt.constructor) || [];
    const type = Reflect.getMetadata('design:type', tgt, name).name;
    attrs.push({ name, type, opts });
    Reflect.defineMetadata(METADATA, attrs, tgt.constructor);
  };

}

/**
 * Get all metadata for a class
 */

export function getMetadata(tgt: Class): Metadata[] {
  return Reflect.getMetadata(METADATA, tgt);
}
