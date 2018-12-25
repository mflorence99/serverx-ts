import { Handler } from '../handler';
import { HttpApp } from '../http/app';
import { Injectable } from 'injection-js';
import { Logger } from '../middlewares/logger';
import { Message } from '../serverx';
import { Observable } from 'rxjs';
import { Route } from '../serverx';

import { createServer } from 'http';
import { map } from 'rxjs/operators';

import chalk from 'chalk';


@Injectable() class Hello extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        const body = 'Hello, http!';
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

@Injectable() class Goodbye extends Handler {
  handle(message$: Observable<Message>): Observable<Message> {
    return message$.pipe(
      map(message => {
        const { response } = message;
        const body = 'Goodbye, http!';
        return { ...message, response: { ...response, body } };
      })
    );
  }
}

const routes: Route[] = [

  {
    path: '',
    methods: ['GET'],
    middlewares: [Logger],
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
      }

    ]
  }

];

const app = new HttpApp(routes);
const listener = app.listen();
const server = createServer(listener)
  .on('listening', () => {
    console.log(chalk.cyan('Examples: http-server listening on port 4200'));
  });
server.listen(4200);
