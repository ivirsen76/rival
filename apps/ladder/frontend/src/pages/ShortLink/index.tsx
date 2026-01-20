import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';
import Error from '@/components/Error';
import axios from '@/utils/axios';
import { useHistory } from 'react-router-dom';

const ShortLink = (props) => {
    const { name, code } = props.match.params;
    const [error, setError] = useState();
    const history = useHistory();

    useEffect(() => {
        const getFullUrl = async () => {
            try {
                const result = await axios.put('/api/actions', { name, code });
                const url = new URL(result.data.url);
                history.push(url.pathname);
            } catch (e) {
                setError('Link is broken');
            }
        };
        getFullUrl();
    }, []);

    if (error) {
        return <Error message={error} />;
    }

    return <Loader loading />;
};

ShortLink.propTypes = {
    match: PropTypes.object,
};

export default ShortLink;
