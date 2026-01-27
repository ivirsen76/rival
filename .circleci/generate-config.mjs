import fs from 'fs';

const tag = process.env.CIRCLE_TAG || '';
const destination = 'generated_config.yml';

let source = 'nothing-config.yml';
if (/^ladder@/.test(tag)) {
    source = 'ladder-config.yml';
}

fs.copyFileSync(source, destination);
