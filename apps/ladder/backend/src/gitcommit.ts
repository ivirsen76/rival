import fs from 'fs';
import path from 'path';

const hash = (() => {
    try {
        return fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'gitcommit'), 'utf8').slice(0, 10);
    } catch (e) {
        return null;
    }
})();

export default () => (req, res, next) => {
    if (hash) {
        res.set({ 'Rival-Hash': hash });
    }
    next();
};
