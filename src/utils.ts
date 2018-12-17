/**
 * @see https://stackoverflow.com/questions/39392853
 */

export interface Class {
  new(...args: any[]): any;
}

/**
 * KV pairs eg: request headers
 */

export interface Map<T> {
  [k: string]: T;
}

