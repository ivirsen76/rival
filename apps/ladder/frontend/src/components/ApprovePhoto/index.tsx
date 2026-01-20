import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import style from './style.module.scss';

const ApprovePhoto = (props) => {
    const { payload } = props;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const result = await axios.put('/api/photos/0', { action: 'approvePhoto', payload });
                const { url } = result.data;

                notification({
                    inModal: true,
                    message: (
                        <div>
                            <img src={url} alt="" className={style.image} />
                            <div className="mt-4">Photo is approved!</div>
                        </div>
                    ),
                });
            } catch (e) {
                // do nothing
            }

            setLoading(false);
        })();
    }, []);

    return <Loader loading={loading} />;
};

ApprovePhoto.propTypes = {
    payload: PropTypes.string,
};

export default ApprovePhoto;
