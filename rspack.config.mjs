import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV !== 'development';

/** @type {import('@rspack/core').Configuration} */
export default {
  mode: isProduction ? 'production' : 'development',
  target: ['web', 'es2015'],
  entry: {
    index: './src/index.ts',
    detect: './src/detect.ts',
    errors: './src/errors.ts'
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: 'chunks/[name]-[contenthash].js',
    module: true,
    library: {
      type: 'modern-module'
    },
    clean: true,
    environment: {
      arrowFunction: true,
      const: true,
      destructuring: true,
      dynamicImport: true,
      module: true
    }
  },
  experiments: {
    outputModule: true
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    extensionAlias: {
      '.js': ['.ts', '.js']
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript'
            },
            target: 'es2015'
          },
          module: {
            type: 'es6'
          }
        },
        type: 'javascript/auto'
      }
    ]
  },
  externalsType: 'module',
  externals: {
    jpeg2000: 'jpeg2000',
    utif2: 'utif2'
  },
  optimization: {
    minimize: isProduction,
    sideEffects: true,
    usedExports: true,
    moduleIds: 'deterministic',
    concatenateModules: true
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map'
};
