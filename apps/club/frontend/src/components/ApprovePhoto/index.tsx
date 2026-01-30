import { useState, useEffect } from 'react';
import Loader from '@rival/common/components/Loader';
import notification from '@rival/common/components/notification';
import axios from '@rival/common/axios';
import style from './style.module.scss';

type ApprovePhotoProps = {
    payload: string;
};

const ApprovePhoto = (props: ApprovePhotoProps) => {
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
            } catch {
                // do nothing
            }

            setLoading(false);
        })();
    }, []);

    return <Loader loading={loading} />;
};

export default ApprovePhoto;
