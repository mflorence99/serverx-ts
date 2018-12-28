import { Observable } from 'rxjs';
import { Readable } from 'stream';

/**
 * Create a case-insensitive object
 */

export function caseInsensitiveObject(obj: any): any {
  const proxy = { };
  Object.keys(obj).forEach((k: string) => proxy[k.toLowerCase()] = obj[k]);
  return new Proxy(proxy, {
    deleteProperty: (tgt: any, k: string) => delete tgt[k.toLowerCase()],
    get: (tgt: any, k: string) => tgt[k.toLowerCase()],
    set: (tgt: any, k: string, v: any) => tgt[k.toLowerCase()] = v,
  });
}

/**
 * Make an observer from a readable stream
 */

export function fromReadableStream(stream: Readable): Observable<any> {
  stream.pause();
  return new Observable(observer => {
    const next = chunk => observer.next(chunk);
    const error = err => observer.error(err);
    const complete = () => observer.complete();
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
