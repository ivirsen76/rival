import { useState, useEffect } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Birthday from '@/components/formik/Birthday';
import PasswordInput from '@/components/formik/PasswordInput';
import Button from '@rival/common/components/Button';
import Loader from '@rival/common/components/Loader';
import { Link, useHistory } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import SearchIcon from '@rival/common/metronic/icons/duotone/General/Search.svg?react';
import CheckIcon from '@rival/common/metronic/icons/duotone/Navigation/Check.svg?react';
import CloseIcon from '@rival/common/metronic/icons/duotone/Navigation/Close.svg?react';
import FieldWrapper from '@/components/formik/FieldWrapper';
import classnames from 'classnames';
import Select from '@/components/formik/Select';
import useSettings from '@/utils/useSettings';
import useStatsigEvents from '@/utils/useStatsigEvents';
import Cookies from 'js-cookie';
import { useDebounce } from 'use-debounce';
import axios from '@/utils/axios';
import { useSelector } from 'react-redux';
import convertDate from '@rival/common/utils/convertDate';
import style from './style.module.scss';

export const comeFromOptions = [
    // { value: 1, label: 'Online' },
    { value: 9, label: 'Referral from a friend' },
    { value: 3, label: 'Flyer from a court' },
    { value: 2, label: 'Word of mouth' },
    // { value: 10, label: 'Business card' },
    { value: 6, label: 'Google search' },
    // { value: 7, label: 'Facebook' },
    // { value: 11, label: 'Instagram' },
    { value: 12, label: 'Social Media' },
    // { value: 4, label: 'Local stringer' },
    // { value: 5, label: 'Local coach' },
    { value: 8, label: 'Email' },
    { value: 99, label: 'Other' },
];

type RegisterFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
    goToLogin: (...args: unknown[]) => unknown;
    showComeFrom: boolean;
};

const RegisterForm = (props: RegisterFormProps) => {
    const history = useHistory();
    const { settings } = useSettings();
    const { comeFromPartners } = settings;

    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [search, setSearch] = useState('');
    const [referrer, setReferrer] = useState(null);
    const [referralMessage, setReferralMessage] = useState('');
    const [debouncedSearch, debounced] = useDebounce(search, 2000);
    const registerHistory = useSelector((state) => state.auth.history);
    const { onRegister } = useStatsigEvents();

    useEffect(() => {
        (async () => {
            const referralCode = (() => {
                // TODO: remove Cookies later
                const code = localStorage.getItem('referralCode') || Cookies.get('referralCode');
                if (code && /^[a-z0-9]{5}$/.test(code)) {
                    return code;
                }

                return null;
            })();

            if (referralCode) {
                const response = await axios.put('/api/users/0', { action: 'getReferrer', search: referralCode });
                if (response.data.status === 'success') {
                    setReferrer({ ...response.data.player, fromLink: true });
                }
            }

            setIsLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!debouncedSearch.trim()) {
            setReferrer(null);
            setReferralMessage('');
            return;
        }

        (async () => {
            setIsSearching(true);

            const response = await axios.put('/api/users/0', { action: 'getReferrer', search: debouncedSearch });
            if (response.data.status === 'success') {
                setReferrer(response.data.player);
                setReferralMessage('');
            } else {
                setReferrer(null);
                setReferralMessage(response.data.message);
            }

            setIsSearching(false);
        })();
    }, [debouncedSearch]);

    const goToLogin = props.goToLogin
        ? props.goToLogin
        : () => {
              history.push('/login');
          };

    if (isLoading) {
        return <Loader loading />;
    }

    const showSearching = isSearching || debounced.isPending();
    const comingFromReferralLink = Boolean(referrer?.fromLink);

    return (
        <Formik
            initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                comeFrom: referrer ? 9 : 0,
                comeFromOther: '',
                agree: false,
                zip: '',
            }}
            onSubmit={async (values) => {
                const additionalValues = {};
                if (referrer && values.comeFrom === 9) {
                    additionalValues.referralCode = referrer.referralCode;
                }
                const partner = comeFromPartners.find((item) => item.value === values.comeFrom);
                if (partner) {
                    additionalValues.referralCode = partner.referralCode;
                    additionalValues.comeFrom = 0;
                    additionalValues.comeFromOther = '';
                }

                await props.onSubmit({
                    ...values,
                    ...additionalValues,
                    birthday: convertDate(values.birthday),
                    registerHistory,
                });
                onRegister();
            }}
        >
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    <div className="mb-6">
                        <h3 className="mb-2">Create an Account</h3>
                        <div className="text-gray-400 fw-semibold fs-5">
                            Already have an account?{' '}
                            <a
                                href=""
                                className="link-primary fw-bold"
                                onClick={(e) => {
                                    e.preventDefault();
                                    goToLogin();
                                }}
                            >
                                Sign in
                            </a>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <Field name="firstName" label="First name" type="text" component={Input} autoFocus />
                        </div>
                        <div className="col">
                            <Field name="lastName" label="Last name" type="text" component={Input} />
                        </div>
                    </div>

                    <Field
                        name="email"
                        label="Email"
                        description="Only visible to your match opponents"
                        type="email"
                        component={Input}
                        renderError={(error) =>
                            error.includes('unique') ? (
                                <div>
                                    This email is already used by another player.
                                    <br />
                                    You can{' '}
                                    <a
                                        href=""
                                        onClick={(e) => {
                                            e.preventDefault();
                                            goToLogin();
                                        }}
                                    >
                                        sign in
                                    </a>{' '}
                                    or <Link to="/forgotPassword">reset password</Link> if you don&apos;t remember it.
                                </div>
                            ) : (
                                error
                            )
                        }
                    />

                    <Field name="phone">
                        {({ field, form }) => (
                            <FieldWrapper
                                label="Phone"
                                description="Only visible to your match opponents"
                                field={field}
                                form={form}
                            >
                                <IMaskInput
                                    mask="000-000-0000"
                                    value={field.value}
                                    unmask
                                    onAccept={(value, mask) => {
                                        form.setFieldValue(field.name, value);
                                    }}
                                    name="phone"
                                    className={classnames('form-control form-control-solid', {
                                        'is-invalid': form.errors[field.name] && form.submitCount > 0,
                                    })}
                                    inputMode="numeric"
                                />
                            </FieldWrapper>
                        )}
                    </Field>

                    <Field name="password" label="Password" component={PasswordInput} />

                    <Field
                        name="birthday"
                        description="Not visible to anyone — only used for age restrictions."
                        label="Birth date"
                        component={Birthday}
                    />

                    {props.showComeFrom && !comingFromReferralLink && (
                        <>
                            <Field
                                name="comeFrom"
                                label="Where did you hear about us?"
                                component={Select}
                                options={[
                                    { value: 0, label: '-- Choose --' },
                                    ...comeFromOptions.filter((item) => item.value !== 99),
                                    ...comeFromPartners,
                                    ...comeFromOptions.filter((item) => item.value === 99),
                                ]}
                            />

                            {values.comeFrom === 99 && (
                                <Field name="comeFromOther" label="Please describe" type="text" component={Input} />
                            )}
                            {values.comeFrom === 3 && (
                                <Field
                                    name="comeFromOther"
                                    label="What location?"
                                    description="Helps us track which courts still have a Rival flyer"
                                    type="text"
                                    component={Input}
                                />
                            )}
                            {values.comeFrom === 9 && (
                                <>
                                    <div>
                                        <label className="form-label">
                                            Find a friend via full name, email, phone, or referral code.
                                        </label>
                                        <div className={style.description}>
                                            Add your friend for them to receive referral bonuses.
                                        </div>
                                        <div className="position-relative">
                                            <input
                                                name="friend"
                                                className="form-control form-control-solid pe-12"
                                                value={
                                                    !showSearching && referrer
                                                        ? `${referrer.firstName} ${referrer.lastName}`
                                                        : search
                                                }
                                                onChange={(e) => setSearch(e.target.value)}
                                                spellCheck={false}
                                            />
                                            <div className="position-absolute translate-middle-y top-50 end-0 me-3">
                                                <span className="svg-icon svg-icon-1">
                                                    <SearchIcon />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 mb-6" style={{ fontSize: '1.075rem', lineHeight: '1.3' }}>
                                        {(() => {
                                            if (showSearching) {
                                                return (
                                                    <span
                                                        className="spinner-border spinner-border-sm align-middle"
                                                        data-spinner="friend"
                                                    />
                                                );
                                            }
                                            if (referrer) {
                                                return (
                                                    <span className={style.success}>
                                                        <span className="svg-icon svg-icon-3 me-1">
                                                            <CheckIcon />
                                                        </span>
                                                        Found!
                                                    </span>
                                                );
                                            }
                                            if (referralMessage) {
                                                return (
                                                    <div className={style.danger + ' d-flex'}>
                                                        <span className="svg-icon svg-icon-3 me-1">
                                                            <CloseIcon />
                                                        </span>
                                                        {referralMessage}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <span className={style.normal}>Start typing to find your friend</span>
                                            );
                                        })()}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    <Button className="mt-4 btn btn-lg btn-primary w-100" isSubmitting={isSubmitting}>
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

RegisterForm.defaultProps = {
    showComeFrom: true,
};

export default RegisterForm;
