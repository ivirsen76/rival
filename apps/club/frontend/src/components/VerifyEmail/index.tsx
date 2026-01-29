import { useState, useEffect, useRef } from 'react';
import axios from '@/utils/axios';
import WarningIcon from '@rival/common/metronic/icons/duotone/Code/Warning-2.svg?react';
import notification from '@/components/notification';
import style from './style.module.scss';

type VerifyEmailProps = {
    sendOnMount: boolean;
    email: string;
    password: string;
    onSuccess: (...args: unknown[]) => unknown;
    render: (...args: unknown[]) => unknown;
    allowResend: boolean;
    verifyCodeCustom: (...args: unknown[]) => unknown;
};

const VerifyEmail = (props: VerifyEmailProps) => {
    const { sendOnMount, email, password, onSuccess, render, allowResend, verifyCodeCustom } = props;
    const [code, setCode] = useState('');
    const [error, setError] = useState();
    const [loading, setLoading] = useState(false);
    const inputRef = useRef();

    useEffect(() => {
        if (sendOnMount) {
            axios.put('/api/users/0', {
                action: 'resendVerificationCode',
                email,
                password,
            });
        }

        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const verifyCode = async () => {
            setLoading(true);

            // Just to show loading state to the user
            // Otherwise the process is too sudden
            await new Promise((resolve) => setTimeout(resolve, 1000));

            try {
                if (verifyCodeCustom) {
                    await verifyCodeCustom({ email, code });
                } else {
                    await axios.put('/api/users/0', {
                        action: 'verifyEmail',
                        email,
                        verificationCode: code,
                    });
                }
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

    const title = <h3>Verify your email</h3>;
    const description = (
        <p>
            We sent a confirmation code to <b className="text-nowrap">{email}</b>.<br />
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
            {allowResend && (
                <div className="mt-12">
                    Didn&apos;t receive the confirmation code?{' '}
                    <a
                        href=""
                        onClick={(e) => {
                            e.preventDefault();
                            notification("We've sent you another email with the confirmation code");
                            // do not wait for the result
                            axios.put('/api/users/0', {
                                action: 'resendVerificationCode',
                                email,
                                password,
                            });
                        }}
                    >
                        Resend the email
                    </a>
                    .
                </div>
            )}
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

VerifyEmail.defaultProps = {
    allowResend: true,
};

export default VerifyEmail;
