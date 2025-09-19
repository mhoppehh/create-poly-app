import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'
import copy from 'rollup-plugin-copy'

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/main.cjs',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/main.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      dts(),
      del({ targets: 'dist/types', hook: 'buildEnd' }),
      copy({
        targets: [{ src: 'src/templates', dest: 'dist/' }],
      }),
    ],
  },
]
