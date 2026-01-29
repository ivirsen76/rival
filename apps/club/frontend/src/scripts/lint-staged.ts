#!/usr/bin/env node

import spawn from 'cross-spawn';
import { getStagedJsFiles } from './utils.js';

const eslint = require.resolve('../../node_modules/eslint/bin/eslint.js');

const stagedFiles = getStagedJsFiles();
if (stagedFiles.length === 0) {
    process.exit();
}

console.info('Linting files');

const result = spawn.sync('node', [eslint].concat(stagedFiles), { stdio: 'inherit' });
process.exit(result.status);
