export function xxx(): any {

  return function(tgt, k) {
    const columns: string[] = Reflect.getMetadata('xxx', tgt.constructor) || [];
    columns.push(k);
    Reflect.defineMetadata('xxx', columns, tgt.constructor);
  };

}
