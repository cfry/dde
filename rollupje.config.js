//see examples in: https://www.sitepoint.com/rollup-javascript-bundler-introduction/
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'


export default {
    input: "src/job_engine/mainje.js",
    plugins: [
        nodeResolve({
            browser: true
        }),
        commonjs(),
        json()
    ],
    output: {
        file: 'build/bundleje.js',
        format: 'es', //could also be 'iife' and 'umd'
        sourcemap: true
    }
};