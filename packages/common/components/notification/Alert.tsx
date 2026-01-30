import { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import style from './style.module.scss';

const transitionTime = 600;

type AlertProps = {
    header: React.ReactNode;
    message: React.ReactNode;
    type: string;
    duration: number;
    onClose: (...args: unknown[]) => unknown;
};

const Alert = (props: AlertProps) => {
    const { header, message, type, duration, onClose } = props;

    const [loaded, setLoaded] = useState(false);
    const timeouts = useRef([]);

    useEffect(() => {
        // Show alert
        timeouts.current.push(
            setTimeout(() => {
                setLoaded(true);
            }, 100)
        );

        // Hide alert after timeout
        if (duration > 0) {
            timeouts.current.push(
                setTimeout(() => {
                    setLoaded(false);
                }, duration)
            );

            timeouts.current.push(setTimeout(onClose, duration + transitionTime));
        }

        return () => {
            onClose();
            timeouts.current.forEach((timeout) => clearTimeout(timeout));
        };
    }, []);

    return (
        <div
            className={classnames('alert', `alert-${type}`, 'alert-dismissible', style.alert, {
                [style.loaded]: loaded,
            })}
        >
            {header && <h4 className="alert-heading">{header}</h4>}
            {message}
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
    );
};

Alert.defaultProps = {
    header: null,
    message: 'Are you sure?',
    type: 'success',
    duration: 5000,
    onClose() {},
};

export default Alert;
