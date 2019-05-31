import cp from 'child_process';

async function bundle() {
  await cp.spawnSync('./node_modules/.bin/babel', ['./src', '-d', './build', '--copy-files'], {
    stdio: 'inherit',
  });
}

// async function bundle() {
//   await cp.spawnSync('./node_modules/.bin/babel', ['./src', '-d', './build', '--presets', 'es2015,stage-2', '--copy-files'], {
//     stdio: 'inherit',
//   });
// }
export default bundle;
