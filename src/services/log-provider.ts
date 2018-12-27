import { Injectable } from 'injection-js';

/**
 * Base log provider
 * 
 * NOTE: uses console.log
 */

@Injectable() export class LogProvider { 

  /** Can this provider colorize? */
  canColorize(): boolean {
    return true;
  }

  /** console proxies */

  log(stuff: any): void {
    console.log(stuff);
  }

  info(stuff: any): void {
    console.info(stuff);
  }

  warn(stuff: any): void {
    console.warn(stuff);
  }

  error(stuff: any): void {
    console.error(stuff);
  }

}
