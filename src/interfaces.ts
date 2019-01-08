import { Attr } from './metadata';
import { Handler } from './handler';
import { IncomingHttpHeaders } from 'http';
import { InfoObject } from 'openapi3-ts';
import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { OutgoingHttpHeaders } from 'http';
import { Provider } from 'injection-js';
import { ReflectiveInjector } from 'injection-js';
import { Router } from './router';
import { URLSearchParams } from 'url';

/**
 * @see https://stackoverflow.com/questions/39392853
 */

export interface Class<T = any> {
  new(...args: any[]): T;
}

/**
 * Content metadata
 */

export interface ContentMetadata {
  [contentType: string]: Class;
}

/**
 * Application context
 */

export interface Context {
  _internal?: any;
  info: InfoObject;
  router: Router;
}

/**
 * Exception definition
 */

export class Exception<T = Response> {
  constructor(public exception: T) { }
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
  context?: Context;
  request?: TRequest;
  response?: TResponse;
}

/**
 * Metadata definition
 */

export interface Metadata {
  _class: Class;
  isArray: boolean;
  metadata: Metadata[];
  name: string;
  opts?: MetadataOpts;
  type: string;
}

export interface MetadataOpts {
  // NOTE: _class is only necessary because TypeScript's design:type tells us
  // that a field is an array, but not of what type -- when it can we'll deprecate 
  // @see https://github.com/Microsoft/TypeScript/issues/7169
  _class?: Class;
  // NOTE: float: false (the default) indicates that a Number is really an integer 
  float?: boolean;
  required?: boolean;
}

/**
 * Method definition
 */

export type Method = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';

export const ALL_METHODS: Method[] = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

/**
 * Request definition
 */

export interface Request<TBody = any,
                         THeaders = IncomingHttpHeaders,
                         TParams = Map<string>,
                         TQuery = URLSearchParams> {
  body?: TBody;
  headers?: THeaders;
  httpVersion?: string;
  method: Method;
  params?: TParams;
  path: string;
  query?: TQuery;
  remoteAddr?: string;
  route?: Route;
  stream$?: Observable<any>;
  timestamp?: number;
}

/**
 * Request metadata
 */

export interface RequestMetadata {
  body?: ContentMetadata;
  header?: Class;
  path?: Class;
  query?: Class;
}

/**
 * Response definition
 */

export interface Response<TBody = any,
                          THeaders = OutgoingHttpHeaders> {
  body?: TBody;
  headers?: THeaders;
  isBase64Encoded?: boolean;
  statusCode?: number;
}

/**
 * Response metadata
 */

export interface ResponseMetadata {
  [statusCode: string]: ContentMetadata;
}

/**
 * 500 response
 */

export class Response500 {
  @Attr() error: string;
  @Attr() stack: string;
}

/**
 * Route definition
 */

export interface Route {
  children?: Route[];
  data?: any;
  description?: string;
  handler?: Class<Handler>;
  injector?: ReflectiveInjector;
  methods?: Method[];
  middlewares?: Class<Middleware>[];
  parent?: Route;
  path: string;
  pathMatch?: 'full' | 'prefix';
  phantom?: boolean;
  redirectAs?: number;
  redirectTo?: string;
  request?: RequestMetadata;
  responses?: ResponseMetadata;
  services?: Provider[];
  summary?: string;
}
