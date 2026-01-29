#!/usr/bin/env node
import fs from 'fs';

const sources = process.argv.slice(2);
const dest = sources.pop();

if (!dest || sources.length < 1) {
    throw new Error('The params are wrong');
}
if (fs.existsSync(dest)) {
    throw new Error('Destination already exists');
}

const env: Record<string, string> = {};
for (const source of sources) {
    const data = fs.readFileSync(source, 'utf8');
    if (data.length > 4000) {
        throw new Error('Wrong file');
    }
    data.split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
            const [key, value] = line.split('=');
            if (!(key in env)) {
                env[key] = value;
            }
        });
}

const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

fs.writeFileSync(dest, content);
