import { IncomingHttpHeaders } from 'http';
import { OutgoingHttpHeaders } from 'http';
import { Route } from './router';
import { URLSearchParams } from 'url';

/**
 * @see https://stackoverflow.com/questions/39392853
 */

export interface Class<T = any> {
  new(...args: any[]): T;
}

/**
 * Application context
 */

export interface Context {
  routes: Route[];
}

/**
 * Error definition
 */

export class Error<T = Response> {
  constructor(public error: T) { }
}

/**
 * KV pairs eg: request headers
 */

export interface Map<T> {
  [k: string]: T;
}

/**
 * Unified message definition
 */

export interface Message<TRequest = Request,
                         TResponse = Response> {
  context: Context;
  request: TRequest;
  response: TResponse;
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

export interface Request<TBody = any,
                         THeaders = IncomingHttpHeaders,
                         TParams = Map<string>,
                         TQuery = URLSearchParams> {
  body?: TBody;
  headers?: THeaders;
  method: Method;
  params?: TParams;
  path: string;
  query?: TQuery;
  route?: Route;
}

/**
 * Response definition
 */

export interface Response<TBody = any,
                          THeaders = OutgoingHttpHeaders> {
  body?: TBody;
  headers?: THeaders;
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
