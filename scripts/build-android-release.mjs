import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const androidDir = path.join(projectRoot, 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

function runGradle(args) {
  const result = spawnSync(gradlew, args, {
    cwd: androidDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runGradle(['clean', '--no-daemon', '--console=plain']);
runGradle([
  ':react-native-vision-camera:prefabReleaseConfigurePackage',
  '--rerun-tasks',
  '--console=plain',
]);
runGradle(['assembleRelease', '--no-daemon', '--console=plain']);
