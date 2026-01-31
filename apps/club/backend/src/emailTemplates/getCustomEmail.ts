import type { Config } from '../types';
import { normal, h2, thankYou, signature } from './normal';

type Parts = {
    h2: typeof h2;
    thankYou: typeof thankYou;
    signature: typeof signature;
};

type Params = { config: Config; compose: (parts: Parts) => string };

export default ({ config, compose }: Params) => {
    const content = compose({ h2, thankYou, signature });

    return normal(content, { config });
};
