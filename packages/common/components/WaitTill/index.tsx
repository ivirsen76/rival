import { useEffect, useState } from 'react';
import dayjs from '../../dayjs';
import formatInterval from './formatInterval';

type WaitTillProps = {
    children: React.ReactNode;
    duration: number;
};

const WaitTill = (props: WaitTillProps) => {
    const { children, duration } = props;
    const [seconds, setSeconds] = useState(0);
    const [date] = useState(() => dayjs.tz().add(duration, 'second'));

    useEffect(() => {
        const interval = setInterval(() => {
            const num = Math.round(date.diff(dayjs.tz(), 'second', true));
            if (num <= 0) {
                setSeconds(0);
                clearInterval(interval);
            } else {
                setSeconds(num);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [date]);

    if (seconds > 0) {
        const text = formatInterval(seconds);
        const minSize = text.length * 0.65;

        return (
            <span className="text-primary">
                Resend code in{' '}
                <span
                    style={{
                        display: 'inline-block',
                        textAlign: 'left',
                        minWidth: `${minSize}rem`,
                        fontWeight: 600,
                    }}
                >
                    {text}
                </span>
            </span>
        );
    }

    return children;
};

WaitTill.defaultProps = {
    duration: 30,
};

export default WaitTill;
