import copy from 'rollup-plugin-copy'

export default {
    input: 'node_modules/rotating-calipers/rotating-calipers.js',
    plugins: [
        copy({
            targets: [{
                src: 'node_modules/rotating-calipers/rotating-calipers.js',
                dest: 'src/third_party',
                transform: (contents, filename) => contents.toString().replace('    RotatingCalipers.name = \'RotatingCalipers\';', '    // RotatingCalipers.name = \'RotatingCalipers\';')
            }]
        })
    ]
};