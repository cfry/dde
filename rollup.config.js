//see examples in: https://www.sitepoint.com/rollup-javascript-bundler-introduction/
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json     from '@rollup/plugin-json'
import css      from "rollup-plugin-import-css";
//import sourcemaps from 'rollup-plugin-sourcemaps'; // https://github.com/maxdavidson/rollup-plugin-sourcemaps


export default {
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
        css(),
        //sourcemaps()
    ],
    output: {
        name: "dde4", //https://gist.github.com/Rich-Harris/d472c50732dab03efeb37472b08a3f32
        file: 'build/bundle.js',
        format: 'es', //could also be 'es' 'iife' and 'umd'
        sourcemap: true // aug 31 2021: using true and bundle.js is 5.3Mbytes. Using 'inline' its 18Mbytes
    }
};