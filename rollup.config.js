//see examples in: https://www.sitepoint.com/rollup-javascript-bundler-introduction/
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs        from '@rollup/plugin-commonjs'
import json            from '@rollup/plugin-json'
import styles          from "rollup-plugin-styles";
//import sourcemaps from 'rollup-plugin-sourcemaps'; // https://github.com/maxdavidson/rollup-plugin-sourcemaps
import copy from 'rollup-plugin-copy'

//from https://www.npmjs.com/package/rollup-plugin-node-polyfills
//import nodePolyfills from 'rollup-plugin-node-polyfills'; errors during build

//https://github.com/FredKSchott/rollup-plugin-polyfill-node

//import nodePolyfills from 'rollup-plugin-polyfill-node'; //error during build
//same problem as above: FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
// from https://stackoverflow.com/questions/65124312/how-to-solve-fatal-error-ineffective-mark-compacts-near-heap-limit-allocation-f
// I increased the heap size to 8K but got the same problem.


export default {
    inlineDynamicImports: true, //needed to support dynamic imports in my code
    input: './src/general/ready.js',
    plugins: [
        nodeResolve({
            browser: true,
            //jsnext: true,         //not in rollplay
            //preferBuiltins: true  //not in rollplay
        }),
        commonjs({
            //there is a bug in rollup importing npm 'ws' which causes it to think
            //ws needs 'bufferutil' and  'utf-8-validate' but it doesn't
            //this below fix of ignore is described in https://github.com/websockets/ws/issues/659
            ignore: ['bufferutil', 'utf-8-validate', // Ignore optional peer dependencies of ws
                     "fs", "path", "crypto" //from https://github.com/TechStark/opencv-js-examples/blob/develop/opencv-js-rollup-example/rollup.config.js  for my opencv broser-capable opencv import
                      //from email to me sept 2, 2024 from notifications@github.com Wilson Tian ttt43ttt (I guess github name, from China.
                    ],
        }),
        json(),
        styles(),
        //sourcemaps()
        //copy({
        //    targets: [
        //        { src: 'node_modules/opencv.js/opencv.js', dest: 'dde/third_party' }
        //    ]
        //}),
        //nodePolyfills() //errors during build
        //nodePolyfills( /* options */ ) //errors during build
    ],
    //see https://rollupjs.org/guide/en/#avoiding-eval and search for onwarn
    onwarn (warning, warn) {
        if(warning.code === "EVAL") { return } //don't show eval warnings
        warn(warning) //do show all other warnings.
    },
    output: {
        name: "dde4", //https://gist.github.com/Rich-Harris/d472c50732dab03efeb37472b08a3f32
        file: 'dde/build/bundle.mjs',
        format: 'es', //could also be 'es' 'iife' and 'umd'
        sourcemap: true, // aug 31 2021: using true and bundle.mjs is 5.3Mbytes. Using 'inline' its 18Mbytes
        assetFileNames: "[name]-[hash][extname]",
    }
};