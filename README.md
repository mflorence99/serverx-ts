# ServeRX-ts

[![Build Status](https://travis-ci.org/mflorence99/serverx-ts.svg?branch=master)](https://travis-ci.org/mflorence99/serverx-ts) 
[![Jest Coverage](./coverage.svg)]()
[![npm](https://img.shields.io/npm/v/serverx-ts.svg)]()
[![node](https://img.shields.io/badge/node-8.10-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![NPM](https://nodei.co/npm/serverx-ts.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/serverx-ts/)

Experimental [Node.js](https://nodejs.org) HTTP framework using [RxJS](https://rxjs.dev), built with [TypeScript](https://www.typescriptlang.org/) and optimized for serverless deployments. Heavily inspired by [Marble.js](https://github.com/marblejs/marble) and [NestJS](https://nestjs.com/).

> See [ServeRX-serverless](https://github.com/mflorence99/serverx-serverless) for a sample app operating in a serverless environment.

<!-- toc -->

- [Rationale](#rationale)
  * [Design Objectives](#design-objectives)
  * [Design Non-Objectives](#design-non-objectives)
  * [Some Bookmarks for Future Work](#some-bookmarks-for-future-work)
- [Key Concepts](#key-concepts)
- [Sample Application](#sample-application)
- [Primer](#primer)
  * [Serverless Support](#serverless-support)
    + [AWS Lambda Considerations](#aws-lambda-considerations)
    + [Google Cloud Functions Considerations](#google-cloud-functions-considerations)
  * [Messages](#messages)
  * [Handlers](#handlers)
  * [Middleware](#middleware)
    + [Immediate Response](#immediate-response)
    + [Built-in Middleware](#built-in-middleware)
    + [Available Middleware](#available-middleware)
  * [Services](#services)
  * [Routing](#routing)
    + [Inheritance](#inheritance)
    + [Path Parameters](#path-parameters)
    + [Redirect](#redirect)
    + [Route Data](#route-data)
  * [File Server](#file-server)
  * [OpenAPI](#openapi)
    + [Informational Annotations](#informational-annotations)
    + [Metadata Annotations](#metadata-annotations)

<!-- tocstop -->

## Rationale

> ServeRX-ts is an experimental project only. It doesn't advocate replacing any other framework and certainly not those from which it has drawn extensively.

### Design Objectives

* *Declarative routes* like [Angular](https://angular.io/guide/router)

* *Functional reactive programming* using [RxJS](https://rxjs.dev) like [Marble.js](https://github.com/marblejs/marble) 

* *Dependency injection* like [Angular](https://v4.angular.io/guide/dependency-injection) and [NestJS](https://nestjs.com/)

* *Serverless support* out-of-the-box for [AWS Lambda](https://aws.amazon.com/lambda/) with functionality similar to [AWS Serverless Express](https://github.com/awslabs/aws-serverless-express) but without the overhead

* *Serverless support* out-of-the-box for [Google Cloud HTTP Functions](https://cloud.google.com/functions/docs/writing/http)

* *Low cold-start latency* as needed in serverless deployments, where in theory every request can trigger a cold start

* *Optimized for microservices* in particular those that send `application/json` responses and typically deployed in serverless environments

* *OpenAPI support* out-of-the-box to support the automated discovery and activation of the microservices for which ServeRX-ts is intended via the standard [OpenAPI](https://swagger.io/docs/specification/about/) specification

* *Full type safety* by using [TypeScript](https://www.typescriptlang.org/) exclusively

* *Maximal test coverage* using [Jest](https://jestjs.io/)

### Design Non-Objectives

* *Deployment of static resources* which can be commoditized via, for example, a CDN. However, ServeRX-ts supplies a simple but effective [FileServer](#file-server) handler that has just enough capability to deploy (say) an [Angular app](https://angular.io/docs).

* *FRP religion* ServeRX-ts believes in using functions where appropriate and classes and class inheritance where they are appropriate

### Some Bookmarks for Future Work

* *Emulator for Express middleware* (but that's hard and definitely back-burner!)

## Key Concepts

Like [Marble.js](https://github.com/marblejs/marble), linear request/response logic is not used to process HTTP traffic. Instead, application code operates on an observable stream. ServeRX-ts does not provide any abstractions for server creation. Either standard [Node.js](https://nodejs.org) APIs are used or appropriate serverless functions.

ServeRX-ts *does* however abstract requests and responses (whatever their source or destination) and bundles them into a stream of `messages`. 

A `Handler` is application code that observes this stream, mapping requests into responses.

Similarly, `middleware` is code that maps requests into new requests and/or responses into new responses. For example, CORS middleware takes note of request headers and injects appropriate response headers.

`Services` can be injected into both handlers and middleware. ServeRX-ts uses the [injection-js](https://github.com/mgechev/injection-js) dependency injection library, which itself provides the same capabilities as in [Angular 4](https://v4.angular.io/guide/dependency-injection). In Angular, services are often used to provide common state, which makes less sense server-side. However in ServeRX-ts, services are a good means of isolating common functionality into testable, extensible and mockable units.

`DI` is also often used in ServeRX-ts to inject configuration parameters into handlers, middleware and services.

`Routes` are the backbone of a ServeRX-ts application. A route binds an HTTP method and path to a handler, middleware and services. Routes can be nested arbitrarily in parent/child relationships, just like [Angular](https://angular.io/guide/router). Middleware and services (and other route attributes) are inherited from a parent.

Routes can be annotated with [OpenAPI](https://swagger.io/docs/specification/about/) metadata to enable the automated deployment of an OpenAPI YAML file that completely describes the API that the ServeRX-ts application implements.

## Sample Application

```ts
import 'reflect-metadata';

import { AWSLambdaApp } from 'serverx-ts';
import { Compressor } from 'serverx-ts';
import { CORS } from 'serverx-ts';
import { GCFApp } from 'serverx-ts';
import { Handler } from 'serverx-ts';
import { HttpApp } from 'serverx-ts';
import { Injectable } from 'injection-js';
import { Message } from 'serverx-ts';
import { Observable } from 'rxjs';
import { RequestLogger } from 'serverx-ts';
import { Route } from 'serverx-ts';

import { createServer } from 'http';
import { tap } from 'rxjs/operators';

@Injectable() class HelloWorld extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap(({ response }) => {
        response.body = 'Hello, world!';
      })
    );
  }
}

const routes: Route[] = [
  {
    path: '',
    methods: ['GET'],
    middlewares: [RequestLogger, Compressor, CORS],
    children: [
      {
        path: '/hello',
        handler: HelloWorld
      },
      {
        // NOTE: default handler sends 200
        // for example: useful in load balancers
        path: '/isalive'
      },
      {
        path: '/not-here',
        redirectTo: 'http://over-there.com'
      }
    ]
  }
];

// local HTTP server
const httpApp = new HttpApp(routes);
createServer(httpApp.listen()).listen(4200);

// AWS Lambda function
const lambdaApp = new AWSLambdaApp(routes);
export function handler(event, context) {
  return lambdaApp.handle(event, context);
}

// Google Cloud HTTP Function
const gcfApp = new GCFApp(routes);
export function handler(req, res) {
  gcfApp.handle(req, res);
}
```

> Be sure to include the following options in `tsconfig.json` when you build ServeRX-ts applications:

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
  }
}
```

> See [ServeRX-serverless](https://github.com/mflorence99/serverx-serverless) for a sample app operating in a serverless environment.

## Primer

> There's just enough information here to understand the principles behind ServeRX-ts. Much detail can be learned from [interfaces.ts](https://github.com/mflorence99/serverx-ts/blob/master/src/interfaces.ts) and from the [Jest](https://jestjs.io/) test cases, which are in-line with the body of the code.

### Serverless Support

[AWS Serverless Express](https://github.com/awslabs/aws-serverless-express) connects AWS Lambda to an [Express](https://expressjs.com/) application by creating a proxy server and routing lambda calls through it so that they appear to [Express](https://expressjs.com/) code as regular HTTP requests and responses. That's a lot of overhead for a cold start, bearing in mind that in theory every serverless request could require a cold start.

[Google Cloud Functions](https://cloud.google.com/functions/docs/writing/http) take a different approach and fabricate [Express](https://expressjs.com/) [request](https://expressjs.com/en/api.html#req) and [response](https://expressjs.com/en/api.html#res) objects.

ServeRX-ts attempts to minimize overhead by injecting serverless calls right into its application code. This approach led a number of design decisions, notably `messages`, discussed next.

ServeRX-ts recommends using the excellent [serverless](https://serverless.com/framework/docs/) framework to deploy to serverless environments.

#### AWS Lambda Considerations

> TODO: discuss how to control binary types and recommended `serverless.yml`.

#### Google Cloud Functions Considerations

> TODO: ??? and recommended `serverless.yml`.

### Messages

ServeRX-ts creates `messages` from inbound requests (either HTTP or serverless) and represents the request and response as simple inner objects.

`message.context` | `message.request` | `message.response`
---|---|---
`info: InfoObject` | `body: any` | `body: any`
`router: Router` | `headers: any` | `headers: any`
&nbsp; | `httpVersion: string` | `statusCode: number`
&nbsp; | `method: string` | 
&nbsp; | `params: any` | 
&nbsp; | `path: string` | 
&nbsp; | `query: URLSearchParams` | 
&nbsp; | `remoteAddr: string` | 
&nbsp; | `route: Route` | 
&nbsp; | `timestamp: number` | 

`messages` are strictly mutable, meaning that application code cannot create new ones. Similarly, inner `request` and `response` should be mutated. A common mutation, for example, is to add or remove `request` or `response` `headers`.

### Handlers

The job of a ServeRX-ts `handler` is to populate `message.response`, perhaps by analyzing the data in `message.request`.

If `response.headers['Content-Type']` is not set, then ServeRX-ts sets it to `application/json`. If `response.statusCode` is not set, then ServeRX-ts sets it to `200`.

All handlers must implement a `handle` method to process a stream of `messages`. Typically:

```ts
@Injectable() class MyHandler extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe( ... );
  }
}
```

### Middleware

The job of ServeRX-ts `middleware` is to prepare and/or post-process streams of `messages`. In a framework like [Express](https://expressjs.com/), programmers can control when `middleware` is executed by the appropriate placement of `app.use()` calls. Because routing in ServeRX-ts is declarative, it uses a different approach.

All ServeRX-ts `middleware` must implement either a `prehandle` or a `posthandle` method, or in special circumstances, both. All `prehandle` methods are executed before a `handler` gains control and all `posthandle` methods afterwards. Otherwise the shape of `middleware` is very similar to that of a `handler`:

```ts
@Injectable() class MyMiddleware extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe( ... );
  }
}
```

A third entrypoint exists: the `postcatch` method is invoked after all `posthandle` methods and even after an error has been thrown. The built-in [RequestLogger](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/request-logger.ts) `middleware` uses this entrypoint to make sure that *all* requests are logged, even those that end in a failure.

> The `postcatch` method cannot itself cause or throw an error.

#### Immediate Response

`middleware` code can trigger an immediate response, bypassing downstream `middleware` and any `handler` by simply throwing an error. A good example might be authentication `middleware` that rejects a request by throwing a 401 error.

> A `handler` can do this too, but errors are more commonly thrown by `middleware`.

```ts
import { Exception } from 'serverx-ts';
// more imports
@Injectable() class Authenticator extends Middleware {
  prehandle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      // more pipeline functions
      switchMap((message: Message): Observable<Message> => {
        return iif(() => !isAuthenticated, 
          // NOTE: the format of an Exception is the same as a Response
          throwError(new Exception({ statusCode: 401 })),
          of(message)); 
      })
    );
  }
}
```

#### Built-in Middleware

* The [Normalizer](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/normalizer.ts) `middleware` is automatically provided for all routes and is guaranteed to run after all other `posthandler`s. It makes sure that `response.headers['Content-Length']`, `response.headers['Content-Type']` and `response.statusCode` are set correctly.

* The [BodyParser](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/body-parser.ts) `middleware` is automatically provided, except in serverless environments, where body parsing is automatically performed. 

#### Available Middleware

* The [Compressor](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/compressor.ts) `middleware` performs `request.body` `gzip` or `deflate` compression, if accepted by the client. See the [compressor tests](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/compressor.test.ts) for an illustration of how it is used and configured.

* The [CORS](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/cors.ts) `middleware` is a wrapper around the robust [Express CORS middleware](https://expressjs.com/en/resources/middleware/cors.html). See the [CORS tests](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/cors.test.ts) for an illustration of how it is used and configured.

* The [RequestLogger](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/request-logger.ts) `middleware` is a gross simplification of the [Express Morgan middleware](https://github.com/expressjs/morgan). See the [request logger tests](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/request-logger.test.ts) for an illustration of how it is used and configured.

* The [Timer](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/timer.ts) `middleware` injects timing information into `response.header`. See the [timer tests](https://github.com/mflorence99/serverx-ts/blob/master/src/middlewares/timer.test.ts) for an illustration of how it is used.

### Services

> TODO: discuss default [LogProvider](https://github.com/mflorence99/serverx-ts/blob/master/src/services/log-provider.ts) and possible [Loggly](https://www.loggly.com/docs/node-js-logs-2/) log provider.

### Routing

ServeRX's routes follow the pattern set by [Angular](https://angular.io/guide/router): they are declarative and hierarchical. For example, the following defines two routes, `GET /foo/bar` and `PUT /foo/baz`:

```ts
const routes: Route[] = {
  {
    path: '/foo',
    children: [
      {
        methods: ['GET'],
        path: '/bar',
        Handler: FooBar
      },
      {
        methods: ['PUT'],
        path: '/baz',
        Handler: FooBaz
      }
    ]
  }
};
```

> Notice how path components are inherited from parent to child. Parent/child relationships can be arbitrarily deep.

#### Inheritance

Paths are not the only route attribute that is inherited; `methods`, `middleware` and `services` are too. Consider this example:

```ts
const routes: Route[] = [
  {
    path: '',
    methods: ['GET'],
    middlewares: [RequestLogger, CORS],
    services: [{ provide: REQUEST_LOGGER_OPTS, useValue: { colorize: true } }]
    children: [
      {
        path: '/bar',
        Handler: FooBar
      },
      {
        path: '/baz',
        services: [{ provide: LogProvider, useClass: MyLogProvider }]
        Handler: FooBaz
      }
    ]
  }
];
```

> Notice how an empty `path` component propagates inheritance but doesn't affect the computed path.

Routes for `GET /bar` and `GET /baz` are defined. Both share the `RequestLogger` and `CORS` `middleware`, the former nominally configured to colorize its output. However, `GET /baz` uses its own custom `LogProvider`.

ServeRX-ts leverages inheritance to inject its standard `middleware` and `services` without special code. The Router takes the supplied routes and wraps them like this:

```ts
  {
    path: '',
    middlewares: [BodyParser /* HTTP only */, Normalizer],
    services: [LogProvider],
    children: [ /* supplied routes */ ]
  }
```

#### Path Parameters

Path parameters are coded using [OpenAPI notation](https://swagger.io/specification/):

```ts
  {
    methods: ['GET'],
    path: '/foo/{this}',
    handler: Foo
  },
  {
    methods: ['GET'],
    path: '/foo/{this}/{that}',
    handler: Foo
  }
```

> Notice how optional parameters are coded by routing variants to the same `handler`.

Path parameters are available to `handlers` in `message.request.params`.

#### Redirect

A redirect can be coded directly into a route:

```ts
  {
    methods: ['GET', 'PUT', 'POST'],
    path: '/not-here',
    redirectTo: 'http://over-there.com',
    redirectAs: 307
  }
```

> If `redirectAs` is not coded, `301` is assumed.

#### Route Data

An arbitrary `data` object can be attached to a route:

```ts
  {
    data: { db: process.env['DB'] },
    methods: ['GET'],
    path: '/foo/bar/baz',
    handler: FooBarBaz
  }
```

> Route `data` can be accessed by both `middleware` and a `handler` via `message.request.route.data`.

### File Server

ServeRX-ts supplies a simple but effective [FileServer](https://github.com/mflorence99/serverx-ts/blob/master/src/handlers/file-server.ts) handler that has just enough capability to deploy (say) an [Angular app](https://angular.io/docs). It can be used in any route, for example:

```ts
const routes: Route[] = [
  {
    path: '',
    children: [
      {
        methods: ['GET'],
        path: '/public',
        handler: FileServer,
        provide: [{ provide: FILE_SERVER_OPTS, useValue: { maxAge: 999, root: '/tmp' } }]
      },
      // other routes
    ]
  }
];
```

By default, it serves files starting from the user's home directory, although that can be customized as shown above. So in that example, `GET /public/x/y/z.js` would attempt to serve `/tmp/x/y/z.js`.

ServeRX-ts forces `must-revalidate` caching and sets `max-age` as customized or one year by default. The file's modification timestamp is used as an `Etag` to control caching via `If-None-Match`.

### OpenAPI

ServeRX-ts supplies an [OpenAPI](https://github.com/mflorence99/serverx-ts/blob/master/src/handlers/open-api.ts) `handler` that can be used in any route, although by convention:

```ts
const routes: Route[] = [
  {
    path: '',
    children: [
      {
        path: 'openapi.yml',
        handler: OpenAPI
      },
      // other routes
    ]
  }
];

const app = new HttpApp(routes, { title: 'http-server', version: '1.0' });
```

The `OpenAPI` `handler` creates a `YAML` response that describes the entire ServeRX-ts application.

> Notice how an `InfoObject` can be passed to `HttpApp`, `AWSLambdaApp` and so on to fulfill the [OpenAPI specification](https://swagger.io/specification/). The excellent [OpenApi3-TS](https://github.com/metadevpro/openapi3-ts) package is a ServeRX-ts dependency and its model definitions can be imported for type-safety.

#### Informational Annotations

Routes can be annotated with `summary` and `description` information:

```ts
const routes: Route[] = [
  {
    path: '',
    methods: ['GET'],
    summary: 'A family of blah blah endpoints',
    children: [
      {
        description: 'Get some bar-type data',
        path: '/bar',
        Handler: FooBar
      },
      {
        description: 'Get some baz-type data',
        path: '/baz',
        Handler: FooBaz
      }
    ]
  }
];
```

> Both `summary` and `description` are inherited.

> Because ServeRX-ts is biased toward microservices, ServeRX-ts does not currently support the many other informational annotations that the full [OpenAPI specification](https://swagger.io/specification/) does.

#### Metadata Annotations

Routes can also be annotated with `request` and `responses` metadata. The idea is to provide `OpenAPI` with decorated classes that describe the format of headers, parameters and request/response body. These classes are the same classes that would be used in `middleware` and `handlers` for type-safety. The `request` and `responses` annotations are inherited.

Consider the following classes:

```ts
class CommonHeader {
  @Attr({ required: true }) x: string;
  @Attr() y: boolean;
  @Attr() z: number;
}

class FooBodyInner {
  @Attr() a: number;
  @Attr() b: string;
  @Attr() c: boolean;
}   

class FooBody {
  @Attr() p: string;
  @Attr() q: boolean;
  @Attr() r: number;
  // NOTE: _class is only necessary because TypeScript's design:type tells us
  // that a field is an array, but not of what type -- when it can we'll deprecate 
  @Attr({ _class: FooBodyInner }) t[]: FooBodyInner;
}

class FooPath {
  @Attr() k: boolean;
}

class FooQuery {
  @Attr({ required: true }) k: number;
}
```

They could be used in the following routes:

```ts
const routes: Route[] = [
  {
    path: '',
    request: {
      header: CommonHeader
    },
    children: [
      {
        methods: ['GET'],
        path: '/foo',
        request: {
          path: FooPath,
          query: FooQuery,
        }
      },
      {
        methods: ['PUT'],
        path: '/foo',
        request: {
          body: {
            'application/x-www-form-urlencoded': FooBody,
            'application/json': FooBody
          }
        }
      },
      {
        methods: ['POST'],
        path: '/bar',
        responses: {
          '200': {
            'application/json': BarBody
          }
        },
      }
    ]
  }
];
```

> Notice how `request` and `responses` are inherited cumulatively.

When ServeRX-ts wraps supplied routes, it automatically adds metadata about the `500` response it handles itself, as if this were coded:

```ts
  {
    path: '',
    middlewares: [BodyParser /* HTTP only */, Normalizer],
    services: [LogProvider],
    responses: {
      '500': { 
        'application/json': Response500
      }
    },
    children: [ /* supplied routes */ ]
  }
```
