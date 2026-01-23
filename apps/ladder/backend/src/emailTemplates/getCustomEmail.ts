import type { Config } from '../types';
import { normal, h2, socialLinks, thankYou, signature } from './normal';

type Params = { config: Config; compose: any };

export default ({ config, compose }: Params) => {
    const content = compose({ h2, socialLinks, thankYou, signature });

    return normal(content, { config });
};
