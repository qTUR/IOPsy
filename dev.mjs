import { spawn } from 'node:child_process';
const run = (cmd, args) => spawn(cmd, args, { stdio: 'inherit', shell: true });
run('node', ['--watch', 'server/index.mjs']);
run('npx', ['vite', '--host']);
