import type { Config } from '../types';
import { normal, h2, socialLinks, thankYou, signature } from './normal';

type Parts = {
    h2: typeof h2;
    socialLinks: typeof socialLinks;
    thankYou: typeof thankYou;
    signature: typeof signature;
};

type Params = { config: Config; compose: (parts: Parts) => string };

export default ({ config, compose }: Params) => {
    const content = compose({ h2, socialLinks, thankYou, signature });

    return normal(content, { config });
};
