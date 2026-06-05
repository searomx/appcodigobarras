#!/usr/bin/env node

import { spawn } from 'node:child_process';

const mode = (process.argv[2] || '').toLowerCase();
const requestedPlatform = (process.argv[3] || '').toLowerCase();

const validModes = new Set(['development', 'production']);
const validPlatforms = new Set(['android', 'ios']);

if (!validModes.has(mode)) {
  console.error(
    'Uso: npm run app:run -- <development|production> [android|ios] [args extras]',
  );
  process.exit(1);
}

const platform = validPlatforms.has(requestedPlatform)
  ? requestedPlatform
  : 'android';

const extraArgs = process.argv.slice(
  validPlatforms.has(requestedPlatform) ? 4 : 3,
);
const args = ['react-native', platform === 'ios' ? 'run-ios' : 'run-android'];

if (mode === 'development') {
  args.push('--mode', platform === 'ios' ? 'Debug' : 'debug');
} else {
  args.push('--mode', platform === 'ios' ? 'Release' : 'release');
}

args.push(...extraArgs);

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', () => {
  process.exit(1);
});
