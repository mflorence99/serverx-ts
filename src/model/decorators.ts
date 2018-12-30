export function xxx(): any {

  return function(tgt, k) {
    const columns: any[] = Reflect.getMetadata('xxx', tgt.constructor) || [];
    const t = Reflect.getMetadata('design:type', tgt, k).name;
    columns.push([ k, t ]);
    Reflect.defineMetadata('xxx', columns, tgt.constructor);
  };

}
