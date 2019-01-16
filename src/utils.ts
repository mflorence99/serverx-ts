import { Observable } from 'rxjs';
import { Readable } from 'stream';

/**
 * Create a case-insensitive object
 * 
 * NOTE: biased to HTTP headers
 */

export function caseInsensitiveObject(obj: any): any {
  const proxy = { };
  Object.entries(obj).forEach(([k, v]) => proxy[normalize(k)] = v);
  return new Proxy(proxy, {
    deleteProperty: (tgt: any, k: string) => delete tgt[normalize(k)],
    get: (tgt: any, k: string) => tgt[normalize(k)],
    set: (tgt: any, k: string, v: any) => { tgt[normalize(k)] = v; return true; },
  });
}

function normalize(k: string): string {
  if (k.split) {
    const words = k.split('-')
      // @see https://en.wikipedia.org/wiki/HTTP_referer
      .map(word => (word.toLowerCase() === 'referer') ? 'referrer' : word)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return words.join('-');
  }
  else return k;
}

/**
 * Deep-copy an object
 * 
 * TODO: we can do better than this!
 */

export function deepCopy<T>(obj: T): T {
  return <T>JSON.parse(JSON.stringify(obj));
}

/**
 * Make an observer from a readable stream
 */

export function fromReadableStream(stream: Readable): Observable<any> {
  stream.pause();
  const buffer = [];
  return new Observable(observer => {
    const next = chunk => buffer.push(chunk);
    const error = err => observer.error(err);
    const complete = () => {
      observer.next(Buffer.concat(buffer));
      observer.complete();
    };
    stream
      .on('data', next)
      .on('error', error)
      .on('end', complete)
      .resume();
    return () => {
      stream.removeListener('data', next);
      stream.removeListener('error', error);
      stream.removeListener('end', complete);
    };
  });
}
