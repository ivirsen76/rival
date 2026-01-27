import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tag = process.env.CIRCLE_TAG || '';
const destination = 'generated_config.yml';

let source = 'nothing-config.yml';
if (/^ladder@/.test(tag)) {
    source = 'ladder-config.yml';
}

fs.copyFileSync(path.join(__dirname, source), destination);
