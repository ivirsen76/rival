#!/usr/bin/env node

import spawn from 'cross-spawn';
import { getStagedJsFiles } from './utils.js';

const vitest = require.resolve('../../node_modules/vitest/vitest.mjs');

const stagedFiles = getStagedJsFiles({
    filter: (file) =>
        !file.includes('src/server/test/service.test.js') && !file.includes('src/server/src/bananas.test.js'),
});
if (stagedFiles.length === 0) {
    process.exit();
}

console.info('Running tests');

const result = spawn.sync('node', [vitest, 'related', '--run'].concat(stagedFiles), {
    stdio: 'inherit',
});
process.exit(result.status);
