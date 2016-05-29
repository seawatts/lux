declare module 'webpack' {
  declare class Asset {
    name: String;
    emitted: boolean;
  }

  declare class Compiler {
    watch(options: {
      poll: boolean,
      aggregateTimeout: number
    }, callback: (err: Error, stats: Stats) => void): void;
  }

  declare class Stats {
    toJson(): {
      assets: Array<Asset>;
      errors: Array<string>;
      warnings: Array<string>;
    };
  }

  declare function factory(config: Object): Compiler;

  declare var exports: factory;
}
