import { Map } from './utils';

/**
 * Request definition
 */

export interface Request {
  body?: any;
  headers?: Map<string>;
  method: string;
  params?: Map<string>;
  query?: Map<string>;
  url: string;
}
