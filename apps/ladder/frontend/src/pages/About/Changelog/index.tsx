import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import style from './style.module.scss';
import ScrollToTop from '@/components/ScrollToTop';
import getData from './getData';
import dayjs from '@/utils/dayjs';
import axios from '@/utils/axios';
import { loadCurrentUser } from '@/reducers/auth';
import { useSelector, useDispatch } from 'react-redux';
import useConfig from '@/utils/useConfig';
import useLazyImages from '@/utils/useLazyImages';
import Header from '@/components/Header';

const Changelog = props => {
    const dispatch = useDispatch();
    const config = useConfig();
    const currentUser = useSelector(state => state.auth.user);
    const [changelogSeenAt] = useState(currentUser ? currentUser.changelogSeenAt : null);
    const [lazyClass] = useLazyImages();

    const list = getData({ config, lazyClass }).map(item => ({
        ...item,
        isNew: currentUser && (!changelogSeenAt || item.date > changelogSeenAt),
    }));

    useEffect(() => {
        if (currentUser) {
            (async () => {
                await axios.put('/api/users/0', { action: 'updateChangelogSeenAt' });
                await dispatch(loadCurrentUser());
            })();
        }
    }, []);

    return (
        <div className="tl-front">
            <Header
                title="What's New"
                description="Explore all the new developments and updates we’re making to the Rival Tennis Ladder each month."
            />
            <ScrollToTop />
            <h2 className="text-white mt-4">What&apos;s New on Rival&nbsp;Tennis&nbsp;Ladder</h2>
            <Card>
                <div className={style.wrapper}>
                    {list.map(item => (
                        <div key={item.date}>
                            <div className={style.header}>
                                <h3 className="m-0">{item.title}</h3>
                                <div className={style.dateWrapper}>
                                    <div className={'badge badge-secondary badge-lg ' + style.date}>
                                        {dayjs(item.date).format('MMM D, YYYY')}
                                    </div>
                                    {item.isNew && (
                                        <div className={'badge badge-danger badge-lg ' + style.new}>New</div>
                                    )}
                                </div>
                            </div>
                            <div className={style.content}>{item.content}</div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Changelog;
