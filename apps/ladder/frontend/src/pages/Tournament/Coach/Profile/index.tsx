import { useEffect } from 'react';
import log from '@/utils/log';
import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import Button from '@rival/packages/components/Button';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import style from './style.module.scss';

const validate = (values) => {
    const errors = {};

    if (!values.message) {
        errors.message = 'Message is required';
    }

    return errors;
};

type ProfileProps = {
    coach: object;
    hide: (...args: unknown[]) => unknown;
};

const Profile = (props: ProfileProps) => {
    const { coach, hide } = props;

    useEffect(() => {
        log({ tableId: coach.id, code: 'browseCoachProfile' });
    }, []);

    const requestCoachLesson = async (values) => {
        await axios.put(`/api/utils/${coach.id}`, { action: 'requestCoachLesson', ...values });
        notification({
            inModal: true,
            message: (
                <span>
                    The request has been sent.
                    <br />
                    The coach will reach out to you via email or phone soon.
                </span>
            ),
        });
        hide();
        log({ tableId: coach.id, code: 'requestLesson', payload: values.message });
    };

    return (
        <div>
            <div className={style.block}>
                <div className={style.photo} style={{ backgroundImage: `url(${coach.photo})` }} />
                <div className="flex-grow-1">
                    <h3 className={style.name}>
                        {coach.firstName} {coach.lastName}
                    </h3>
                    <div className={style.price}>${coach.price} per hour</div>
                </div>
            </div>
            {coach.bullets.length > 0 && (
                <div className="alert alert-primary mt-8 mb-0">
                    <ul className="m-0 ps-6">
                        {coach.bullets.map((item, index) => (
                            <li key={index} className="m-0">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <h3>About</h3>
            <div className={style.description}>{coach.description}</div>

            <h3>Location{coach.locationAddress.length > 1 ? 's' : ''}</h3>
            <div>
                {coach.locationAddress.length > 0 && (
                    <ul className="ps-4">
                        {coach.locationAddress.map((item, index) => (
                            <li key={index}>
                                <b>{item.name}</b>
                                <br />
                                {item.address}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {coach.locationImage && (
                <div className={style.map}>
                    <img src={coach.locationImage} alt="Map" />
                    {coach.locationAddress
                        .filter((item) => item.top && item.left)
                        .map((item) => (
                            <div
                                key={item.name}
                                className={style.mark}
                                style={{ top: `${item.top}`, left: `${item.left}` }}
                            />
                        ))}
                </div>
            )}

            <h3>Contact {coach.firstName}</h3>
            <Formik initialValues={{ message: '' }} validate={validate} onSubmit={requestCoachLesson}>
                {({ values, isSubmitting }) => (
                    <Form noValidate>
                        <Field
                            name="message"
                            label=""
                            description="Sending this request will include your name, email, phone number, and profile. Describe your goals, requirements, or flexibility below."
                            component={Textarea}
                            style={{ minHeight: '8rem' }}
                        />
                        <Button className="btn btn-primary" isSubmitting={isSubmitting}>
                            Send request
                        </Button>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default Profile;
