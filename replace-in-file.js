import replace from 'replace-in-file';
const results = replace.sync({
  files: 'src/third_party/rotating-calipers.js',
  from: /    RotatingCalipers\.name = 'RotatingCalipers';/,
  to: '    // RotatingCalipers\.name = \'RotatingCalipers\';',
  verbose: true
});

console.log(results);
