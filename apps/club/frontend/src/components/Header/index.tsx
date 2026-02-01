import { Helmet } from 'react-helmet';
import useConfig from '@rival/common/utils/useConfig';

type HeaderProps = {
    title?: string;
    description: string;
    schema?: object;
};

const Header = (props: HeaderProps) => {
    const config = useConfig();

    if (!config?.city) {
        return null;
    }

    const base = `${config.city} Rival Tennis Ladder`;
    const title = props.title ? `${props.title} | ${base}` : `${config.city}, ${config.state} | Rival Tennis Ladder`;

    return (
        <Helmet>
            <title>{title}</title>
            {props.description ? <meta name="description" content={props.description} /> : null}
            {props.schema && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'http://schema.org',
                        '@type': 'WebSite',
                        name: base,
                        ...props.schema,
                    })}
                </script>
            )}
        </Helmet>
    );
};

Header.defaultProps = {
    schema: {},
};

export default Header;
