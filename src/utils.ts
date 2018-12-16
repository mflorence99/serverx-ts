/**
 * KV pairs eg: request headers
 */

export interface Map<T> {
  [k: string]: T;
}

export interface Class { new(...args: any[]): any; }
