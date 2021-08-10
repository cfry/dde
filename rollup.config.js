//see examples in: https://www.sitepoint.com/rollup-javascript-bundler-introduction/
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'


export default {
    input: './src/general/ready.js',
    plugins: [
        nodeResolve({
            browser: true,
            jsnext: true
        }),
        commonjs({
            //include: [ "./src/main.js", "./node_modules/**" ]
        }),
        json()
    ],
    output: {
        name: "dde4", //https://gist.github.com/Rich-Harris/d472c50732dab03efeb37472b08a3f32
        file: 'build/bundle.js',
        format: 'es', //could also be 'iife' and 'umd'
        sourcemap: true
    }
};