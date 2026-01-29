import { useState, useEffect, useRef } from 'react';
import axios from '@/utils/axios';
import WarningIcon from '@rival/packages/metronic/icons/duotone/Code/Warning-2.svg?react';
import PhoneIcon from '@rival/packages/metronic/icons/duotone/Interface/Phone.svg?react';
import notification from '@/components/notification';
import WaitTill from '@/components/WaitTill';
import formatPhone from '@rival/packages/utils/formatPhone';
import style from './style.module.scss';

type VerifyPhoneProps = {
    phone: string;
    onSuccess: (...args: unknown[]) => unknown;
    render: (...args: unknown[]) => unknown;
};

const VerifyPhone = (props: VerifyPhoneProps) => {
    const { phone, onSuccess, render } = props;
    const [iteration, setIteration] = useState(0);
    const [code, setCode] = useState('');
    const [error, setError] = useState();
    const [loading, setLoading] = useState(false);
    const inputRef = useRef();

    useEffect(() => {
        (async () => {
            axios.put('/api/users/0', { action: 'sendPhoneVerificationCode', phone });

            await new Promise((resolve) => setTimeout(resolve, 500));
            if (inputRef.current) {
                inputRef.current.focus();
            }
        })();
    }, []);

    useEffect(() => {
        const verifyCode = async () => {
            setLoading(true);

            // Just to show loading state to the user
            // Otherwise the process is too sudden
            await new Promise((resolve) => setTimeout(resolve, 1000));

            try {
                await axios.put('/api/users/0', {
                    action: 'verifyPhone',
                    phone,
                    code,
                });
                await onSuccess();
            } catch {
                setError('Confirmation code is wrong');
            }

            setLoading(false);
        };

        if (code.length === 6) {
            verifyCode();
        }
    }, [code]);

    const addIteration = () => setIteration((prev) => prev + 1);

    const title = (
        <div className="mb-4">
            <span className="svg-icon svg-icon-primary svg-icon-5x">
                <PhoneIcon />
            </span>
        </div>
    );
    const description = (
        <p>
            We sent a confirmation code to <b>{formatPhone(phone)}</b>.<br />
            Please enter the 6-digit code:
        </p>
    );

    const body = (
        <>
            <div className={style.code}>
                <input
                    name="code"
                    type="text"
                    className="form-control form-control-lg"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d]+/g, ''))}
                    ref={inputRef}
                    autoComplete="off"
                    inputMode="numeric"
                />
            </div>
            {loading && (
                <div className="mt-4 mb-4">
                    <span className="spinner-border spinner-border-sm align-middle me-2" />
                    Verifying
                </div>
            )}
            {!loading && error && (
                <div className="text-danger mt-4 mb-4 d-flex justify-content-center align-items-center">
                    <span className="svg-icon svg-icon-1 svg-icon-danger me-2">
                        <WarningIcon />
                    </span>
                    {error}
                </div>
            )}
            <div className="mt-12">
                Didn&apos;t receive the confirmation code?{' '}
                <WaitTill key={iteration}>
                    <a
                        href=""
                        onClick={(e) => {
                            e.preventDefault();
                            notification("We've sent you another message with the confirmation code.");
                            addIteration();
                            // do not wait for the result
                            axios.put('/api/users/0', { action: 'sendPhoneVerificationCode', phone });
                        }}
                    >
                        Resend code
                    </a>
                </WaitTill>
            </div>
        </>
    );

    if (render) {
        return render({ title, description, body });
    }

    return (
        <div>
            {title}
            {description}
            {body}
        </div>
    );
};

export default VerifyPhone;
