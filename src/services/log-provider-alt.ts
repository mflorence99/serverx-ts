import { Injectable } from 'injection-js';
import { LogProvider } from './log-provider';
import { Message } from '../serverx';

import chalk from 'chalk';

@Injectable() export class LogProviderAlt extends LogProvider {

  /** Log error */
  logError(error: Error): void {
    console.log(chalk.yellowBright(error.toString()));
    console.log(error.stack);
  }

  /** Log message */
  logMessage(message: Message): void {

  }

}
