import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs        from '@rollup/plugin-commonjs'
import json            from '@rollup/plugin-json'
import styles          from "rollup-plugin-styles";

export default {
    inlineDynamicImports: true,
    input: 'httpd.mjs',
    plugins: [
        nodeResolve( //{
            //browser: true //https://www.npmjs.com/package/@rollup/plugin-node-resolve
            //jsnext: true,         //not in rollplay
            //preferBuiltins: true  //not in rollplay
            //}
          ),
        commonjs({
                 //there is a bug in rollup importing npm 'ws' which causes it to think
                 //ws needs 'bufferutil' and  'utf-8-validate' but it doesn't
                 //this below fix of ignore is described in https://github.com/websockets/ws/issues/659
                 ignore: ['bufferutil', 'utf-8-validate'], // Ignore optional peer dependencies of ws
             }),
        json(),
        styles()
        ],
    output: {
        file: 'dde/build/bundle_server.mjs',
        sourcemap: true,
    }
};
