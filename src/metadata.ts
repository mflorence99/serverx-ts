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
  float: false,
  required: false
};

/**
 * Define an attribute (parameter, body etc)
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Attr(opts: MetadataOpts = DEFAULT_OPTS): any {
  return function (tgt: any, name: string): void {
    // grab the metadata to date for this class
    const attrs: Metadata[] =
      Reflect.getMetadata(METADATA, tgt.constructor) || [];
    // what type does TypeScript say this property is?
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let _class = Reflect.getMetadata('design:type', tgt, name);
    let type = _class.name;
    // NOTE: _class is only necessary because TypeScript's design:type tells us
    // that a field is an array, but not of what type -- when it can we'll deprecate
    // @see https://github.com/Microsoft/TypeScript/issues/7169
    const isArray = type === 'Array';
    if (opts._class) {
      _class = opts._class;
      type = _class.name;
    }
    // update the record of metadata by class
    // eslint-disable-next-line @typescript-eslint/naming-convention
    attrs.push({ _class, isArray, metadata: [], name, type, opts });
    Reflect.defineMetadata(METADATA, attrs, tgt.constructor);
  };
}

/**
 * Get all metadata for a class
 */

export function getMetadata(tgt: Class): Metadata[] {
  return [...Reflect.getMetadata(METADATA, tgt)];
}

/**
 * Recursively resolve metdata within metadata
 */

export function resolveMetadata(metadata: Metadata[]): Metadata[] {
  metadata.forEach((metadatum) => {
    // NOTE: see above -- we won't see Array if opts._class is provided
    if (!['Array', 'Boolean', 'Number', 'String'].includes(metadatum.type))
      metadatum.metadata = resolveMetadata(getMetadata(metadatum._class));
  });
  return metadata;
}
