import { Observable } from 'rxjs';
import { Readable } from 'stream';

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
