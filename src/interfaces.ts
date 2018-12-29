import { Handler } from './handler';
import { IncomingHttpHeaders } from 'http';
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
 * MIME type
 */

export enum ContentType {
  APPLICATION = 'application/*',
  APPLICATION_ECMASCRIPT = 'application/ecmascript',
  APPLICATION_JAVASCRIPT = 'application/javascript',
  APPLICATION_JSON = 'application/json',
  APPLICATION_OCTET_STREAM = 'application/octet-stream',
  APPLICATION_X_WWW_FORM_URLENCODED = 'x-www-form-urlencoded',
  AUDIO = 'audio/*',
  AUDIO_MPEG = 'audio/mpeg',
  AUDIO_OGG = 'audio/ogg',
  IMAGE_GIF = 'image/gif',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_SVG_XML = 'image/svg+xml',
  TEXT_CSS = 'text/css',
  TEXT_HTML = 'text/html',
  TEXT_PLAIN = 'text/plain',
  TEXT_YAML = 'text/yaml',
  VIDEO_MP4 = 'video/mp4',
}

/**
 * Application context
 */

export interface Context {
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
 * Method definition
 */

export type Method = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE' | '*';

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
 * Response definition
 */

export interface Response<TBody = any,
                          THeaders = OutgoingHttpHeaders> {
  body?: TBody;
  headers?: THeaders;
  isBase64Encoded?: boolean;
  statusCode?: StatusCode;
}

/**
 * Route definition
 */

export interface Route {
  children?: Route[];
  data?: any;
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
  services?: Provider[];
}

/**
 * Status code definition
 */

export enum StatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  REDIRECT = 301,
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
