export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      const v = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);
      if (v != null) {
        Object.defineProperty(derivedCtor.prototype, name, v);
      }
    });
  });
}
