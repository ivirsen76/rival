import spawn from 'cross-spawn';
import fs from 'fs';

const currentDir = process.cwd();

module.exports = {
    getStagedJsFiles({ filter } = {}) {
        return spawn
            .sync('git', ['diff', '--cached', '--name-only'])
            .stdout.toString()
            .trim()
            .split('\n')
            .filter(file => /\.jsx?$/.test(file))
            .filter(file => fs.existsSync(currentDir + '/' + file))
            .filter(file => !filter || filter(file));
    },
};
