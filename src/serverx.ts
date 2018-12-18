import { Route } from './router';

/**
 * @see https://stackoverflow.com/questions/39392853
 */

export interface Class {
  new(...args: any[]): any;
}

/**
 * Error definition
 */

export class Error {
  constructor(public message: string,
              public status: Status,
              public data = { }) { }
}

/**
 * KV pairs eg: request headers
 */

export interface Map<T> {
  [k: string]: T;
}

/**
 * Method definition
 */

export enum MethodType {
  CONNECT,
  DELETE,
  GET,
  HEAD,
  OPTIONS,
  PATCH,
  POST,
  PUT,
  TRACE
}

export type Method = keyof typeof MethodType;

/**
 * Request definition
 */

export interface Request {
  body?: any;
  headers?: Map<string>;
  method: Method;
  params?: Map<string>;
  path: string;
  query?: Map<string>;
  route?: Route;
}

/**
 * Response definition
 */

export interface Response {
  body?: any;
  headers?: Map<string>;
  status?: Status;
}

/**
 * Status definition
 */

export enum Status {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  FAILED_DEPENDENCY = 424,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}
