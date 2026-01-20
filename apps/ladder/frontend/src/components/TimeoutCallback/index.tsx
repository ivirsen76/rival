import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import formatDuration from '@/utils/formatDuration';

const TimeoutCallback = (props) => {
    const { render, onTimeout, deadline } = props;

    const [secondsLeft, setSecondsLeft] = useState();

    useEffect(() => {
        const localDeadline = deadline.toDate();
        let prevDiff;

        const interval = setInterval(() => {
            const currentDate = new Date();
            const diff = Math.ceil((localDeadline - currentDate) / 1000);

            if (diff !== prevDiff && diff >= 0) {
                setSecondsLeft(diff);
                prevDiff = diff;
            }

            if (diff === 0) {
                clearInterval(interval);
                if (onTimeout) {
                    onTimeout();
                }
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [deadline]);

    if (!render) {
        return null;
    }

    const timeLeft = (
        <span className={classnames(secondsLeft < 3600 && 'text-danger')}>{formatDuration(secondsLeft)}</span>
    );

    return render({ secondsLeft, timeLeft });
};

TimeoutCallback.propTypes = {
    deadline: PropTypes.object,
    onTimeout: PropTypes.func,
    render: PropTypes.func,
};

export default TimeoutCallback;
