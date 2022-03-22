//see examples in: https://www.sitepoint.com/rollup-javascript-bundler-introduction/
import { nodeResolve } from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node';


import commonjs from '@rollup/plugin-commonjs'
import json     from '@rollup/plugin-json'


export default {
    inlineDynamicImports: true, //needed to support dynamic imports in my code
    input: "./src/job_engine/ready_je.js",
    plugins: [
        //see https://npmmirror.com/package/@rollup/plugin-node-resolve
        //if browser: true, uses package.json browser props. But I don't have any
        //so I guess don't use it, but rollup.config for dde DOES use it.
        nodeResolve({
            browser: false,
            preferBuiltins: true //gets rid of warnig when building the bundle
               //for the node package "util". Use the built-in version
               //instead of the version in node_module folder is fine.
        }),
        commonjs(),
        json(),
        nodePolyfills( /* options */ )
    ],

    //see https://rollupjs.org/guide/en/#avoiding-eval and search for onwarn
    onwarn (warning, warn) {
        if(warning.code === "EVAL") { return } //don't show eval warnings
        warn(warning) //do show all other warnings.
    },
    output: {
        //name: "dde4_job_engine", //not sure if this is used for anything
        file: 'dde/build/bundleje.js',
        format: 'es', //could also be 'iife' and 'umd'
        sourcemap: true
    }
};