declare module 'webpack' {
  declare class Compiler {}
  declare function factory(config: Object): Compiler;

  declare var exports: factory;
}
