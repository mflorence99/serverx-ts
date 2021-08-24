import { Injectable } from 'injection-js';

/**
 * Base log provider
 *
 * NOTE: uses console.log
 */

@Injectable()
export class LogProvider {
  /** Can this provider colorize? */
  canColorize(): boolean {
    return true;
  }

  /** console proxies */

  error(stuff: any): void {
    console.error(stuff);
  }

  info(stuff: any): void {
    console.info(stuff);
  }

  log(stuff: any): void {
    console.log(stuff);
  }

  warn(stuff: any): void {
    console.warn(stuff);
  }
}
