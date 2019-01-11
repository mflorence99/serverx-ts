import 'reflect-metadata';

import { Compressor } from '../middlewares/compressor';
import { CORS } from '../middlewares/cors';
import { FileServer } from '../handlers/file-server';
import { HttpApp } from '../http/app';
import { RequestLogger } from '../middlewares/request-logger';
import { Route } from '../interfaces';

import { createServer } from 'http';

import chalk from 'chalk';

const routes: Route[] = [

  {
    path: '/',
    handler: FileServer,
    middlewares: [Compressor, CORS, RequestLogger]
  }

];


const app = new HttpApp(routes);

const listener = app.listen();
const server = createServer(listener)
  .on('listening', () => {
    console.log(chalk.cyanBright('Examples: file-server listening on port 4200'));
  });

server.listen(4200);
