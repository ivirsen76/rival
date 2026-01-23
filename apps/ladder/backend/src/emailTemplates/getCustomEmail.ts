import type { Config } from '../types';
import { normal, h2, socialLinks, thankYou, signature } from './normal';

export default ({ config, compose }: { config: Config; compose: any }) => {
    const content = compose({ h2, socialLinks, thankYou, signature });

    return normal(content, { config });
};
