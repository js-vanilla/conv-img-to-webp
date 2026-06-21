import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV !== 'development';

/** @type {import('@rspack/core').Configuration} */
export default {
  mode: isProduction ? 'production' : 'development',
  target: ['web', 'es2015'],
  entry: {
    index: './src/index.js',
    detect: './src/core/detect.js',
    errors: './src/core/errors.js'
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
      module: true,
      dynamicImport: true,
      arrowFunction: true,
      const: true,
      destructuring: true
    }
  },
  experiments: {
    outputModule: true
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
