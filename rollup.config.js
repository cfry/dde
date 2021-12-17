//see examples in: https://www.sitepoint.com/rollup-javascript-bundler-introduction/
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json     from '@rollup/plugin-json'
import styles from "rollup-plugin-styles";
//import sourcemaps from 'rollup-plugin-sourcemaps'; // https://github.com/maxdavidson/rollup-plugin-sourcemaps
import copy from 'rollup-plugin-copy'


export default {
    inlineDynamicImports: true, //needed to support dynamic imports in my code
    input: './src/general/ready.js',
    plugins: [
        nodeResolve({
            browser: true,
            //jsnext: true,         //not in rollplay
            //preferBuiltins: true  //not in rollplay
        }),
        commonjs(
            //{include: [ "./src/main.js", "./node_modules/**" ] }
        ),
        json(),
        styles(),
        //sourcemaps()
        copy({
            targets: [
                { src: 'node_modules/opencv.js/opencv.js', dest: 'dde/third_party' }
            ]
        })
    ],
    output: {
        name: "dde4", //https://gist.github.com/Rich-Harris/d472c50732dab03efeb37472b08a3f32
        file: 'dde/build/bundle.js',
        format: 'es', //could also be 'es' 'iife' and 'umd'
        sourcemap: true, // aug 31 2021: using true and bundle.js is 5.3Mbytes. Using 'inline' its 18Mbytes
        assetFileNames: "[name]-[hash][extname]",
    }
};