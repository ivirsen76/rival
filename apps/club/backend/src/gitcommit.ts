import fs from 'fs';
import path from 'path';

const hash = (() => {
    try {
        return fs.readFileSync(path.resolve(__dirname, '..', 'gitcommit'), 'utf8').slice(0, 10);
    } catch {
        return null;
    }
})();

// @ts-expect-error - don't know the type
export default () => (req, res, next) => {
    if (hash) {
        res.set({ 'Rival-Hash': hash });
    }
    next();
};
