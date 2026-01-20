import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import useConfig from '@/utils/useConfig';

const Header = (props) => {
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

Header.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    schema: PropTypes.object,
};

Header.defaultProps = {
    schema: {},
};

export default Header;
