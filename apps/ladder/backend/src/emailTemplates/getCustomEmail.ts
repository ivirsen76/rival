import { normal, h2, socialLinks, thankYou, signature } from './normal';

export default ({ config, compose }) => {
    const content = compose({ h2, socialLinks, thankYou, signature });

    return normal(content, { config });
};
