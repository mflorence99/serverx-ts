# ServeRX-ts

[![Build Status](https://travis-ci.org/mflorence99/serverx-ts.svg?branch=master)](https://travis-ci.org/mflorence99/serverx-ts) 
[![Jest Coverage](./coverage.svg)]()
[![npm](https://img.shields.io/npm/v/serverx-ts.svg)]()
[![node](https://img.shields.io/badge/node-8.10-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![NPM](https://nodei.co/npm/serverx-ts.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/serverx-ts/)

Experimental [Node.js](https://nodejs.org) HTTP framework using [RxJS](https://rxjs.dev), built with [TypeScript](https://www.typescriptlang.org/) and optimized for serverless deployments. Heavily inspired by [Marble.js](https://github.com/marblejs/marble) and [NestJS](https://nestjs.com/).

<!-- toc -->

- [Rationale](#rationale)
  * [Design Objectives](#design-objectives)
  * [Design Non-Objectives](#design-non-objectives)
  * [Bookmarks for Future Work](#bookmarks-for-future-work)
- [Key Concepts](#key-concepts)
- [Sample Application](#sample-application)

<!-- tocstop -->

## Rationale

> ServeRX-ts is an experimental project only. It doesn't advocate replacing any other framework and certainly not those from which it has drawn extensively.

### Design Objectives

* **Declarative routes** like [Angular](https://angular.io/guide/router)

* **Functional reactive programming** using [RxJS](https://rxjs.dev) like [Marble.js](https://github.com/marblejs/marble) 

* **Dependency injection** like [Angular](https://v4.angular.io/guide/dependency-injection) and [NestJS](https://nestjs.com/)

* **Serverless support** out-of-the-box for [AWS Lambda](https://aws.amazon.com/lambda/) with functionality similar to [AWS Serverless Express](https://github.com/awslabs/aws-serverless-express) but without the overhead

* **Low cold-start latency** as needed in serverless deployments, where in theory every request can trigger a cold start

* **Optimized for microservices** in particular those that deploy `application/json` responses and typically deployed in serverless environments

* **OpenAPI support** out-of-the-box to support the automated discovery and activation of the microservices for which ServeRX-ts is intended via the standard [OpenAPI](https://swagger.io/docs/specification/about/) specification

* **Full type safety** by using [TypeScript](https://www.typescriptlang.org/) exclusively

* **Maximal test coverage** using [Jest](https://jestjs.io/)

### Design Non-Objectives

* **Deployment of static resources** which can be commoditized via, for example, a CDN

* **FRP religion** ServeRX-ts believes in using functions where appropriate and classes and class inheritance where they are appropriate

### Bookmarks for Future Work

* **Google Cloud Function** support

* **Emulator for Express middleware** (but that's hard and definitely back-burner!)

## Key Concepts

Like [Marble.js](https://github.com/marblejs/marble), linear request/response logic is not used to process HTTP traffic. Instead, application code operates on an observable stream. ServeRX-ts does not provide any abstractions for server creation. Instead, either standard [Node.js](https://nodejs.org) APIs are used or appropriate serverless functions.

ServeRX-ts *does* however abstract requests and responses (whatever their source or destination) and bundles them into a stream of `messages`. 

A `Handler` is application code that observes this stream, mapping requests into responses.

Similarly, `middleware` is code that maps requests into new requests and/or responses into new responses. For example, CORS middleware takes note of request headers and injects appropriate response headers.

`Services` can be injected into both handlers and middleware. ServeRX-ts uses the [injection-js](https://github.com/mgechev/injection-js) dependency injection `DI` library, which itself provides the same capabilities as in [Angular 4](https://v4.angular.io/guide/dependency-injection). In Angular, services are often used to provide common state, which makes less sense server-side. However in ServeRX-ts, services are a good means of isolating common functionality into testable and mockable units.

`DI` is also often used in ServeRX-ts to inject configuration parameters into handlers, middleware and services.

`Routes` are the backbone of a ServeRX-ts application. A route binds an HTTP method and path to a handler, middleware and services. Routes can be nested arbitrarily in parent/child relationships, just like [Angular](https://angular.io/guide/router). Middleware and services (and other route attributes) are inherited from a parent.

Routes can be annotated with [OpenAPI](https://swagger.io/docs/specification/about/) metadata to enable the automated deployment of an OpenAPI YAML file that completely describes the API that the ServeRX-ts application implements.

## Sample Application

```ts
import { Compressor } from 'serverx-ts';
import { CORS } from 'serverx-ts';
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
        // example useful in load balancers
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
  lambdaApp.handle(event, context);
}
```
