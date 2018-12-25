import { Injectable } from 'injection-js';
import { Message } from '../serverx';

import chalk from 'chalk';

@Injectable() export class LogProvider { 

  /** Log error */
  logError(error: Error): void {
    console.log(chalk.redBright(error.toString()));
    console.log(error.stack);
  }

  /** Log message */
  logMessage(message: Message): void {

  }

}
