import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import { name, version } from './package.json'

const banner = `${'/*!\n' + ' * '}${name}.js v${version}\n` +
` * (c) 2020-2021 sprying\n` +
` * (c) 2022 zhyupe\n` +
' * Released under the MIT License.\n' +
' */'

const isProd = process.env.NODE_ENV === 'production'

export default {
  input: './src/index.ts',
  external: ['fs', 'path', 'child_process', 'through', 'os', 'chalk', 'lodash', 'rxjs', 'debug', 'inquirer', 'commander', 'command-exists', 'fs-extra', 'rimraf', 'moment', 'util', 'node-forge'],
  output: [{
    file: './dist/index.js',
    format: 'cjs',
    banner,
    inlineDynamicImports: true
  }, {
    file: './dist/index.esm.js',
    format: 'es',
    banner,
    inlineDynamicImports: true
  }],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      clean: true,
      rollupCommonJSResolveHack: true,
      exclude: ['*.d.ts', '**/*.d.ts'],
      useTsconfigDeclarationDir: true
    }),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    isProd && terser()
  ].filter(Boolean)
}
