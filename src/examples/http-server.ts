import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Injectable } from 'injection-js';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { REQUEST_LOGGER_OPTS } from '../middlewares/request-logger';
import { RequestLogger } from '../middlewares/request-logger';
import { Route } from '../serverx';

import { createServer } from 'http';
import { tap } from 'rxjs/operators';

import chalk from 'chalk';

@Injectable() class Explode extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response['x']['y'] = 'z';
      })
    );
  }
}

@Injectable() class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.body = 'Hello, http!';
      })
    );
  }
}

@Injectable() class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      tap((message: Message) => {
        const { response } = message;
        response.body = 'Goodbye, http!';
      })
    );
  }
}

const routes: Route[] = [

  {
    path: '',
    methods: ['GET'],
    middlewares: [RequestLogger],
    services: [{ provide: REQUEST_LOGGER_OPTS, useValue: { colorize: true } }],
    children: [

      {
        path: '/hello',
        handler: Hello
      },

      {
        path: '/goodbye',
        handler: Goodbye
      },

      {
        path: '/isalive'
      },

      {
        methods: ['GET'],
        path: '/explode',
        handler: Explode
      },

      {
        methods: ['GET'],
        path: '/not-here',
        redirectTo: 'http://over-there.com'
      }

    ]
  }

];

const app = new HttpApp(routes);
const listener = app.listen();
const server = createServer(listener)
  .on('listening', () => {
    console.log(chalk.cyanBright('Examples: http-server listening on port 4200'));
  });
server.listen(4200);
