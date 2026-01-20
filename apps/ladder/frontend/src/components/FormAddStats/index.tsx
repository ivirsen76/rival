import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';
import HiddenText from '@/components/HiddenText';
import axios from '@/utils/axios';
import style from './style.module.scss';

const FormAddStats = props => {
    const { match } = props;

    const onSubmit = async values => {
        const response = await axios.put(`/api/matches/${match.id}`, { action: 'addStats', link: values.link });
        await props.onSubmit(response.data.data);
    };

    return (
        <Formik initialValues={{ link: '' }} onSubmit={onSubmit}>
            {({ handleSubmit, isSubmitting }) => (
                <Form noValidate>
                    <HiddenText title="How can you get statistics?" className="mb-4">
                        <div>
                            <p>Get statistics by tracking the match score on your Apple Watch.</p>
                            <ol className="mb-0">
                                <li>
                                    Install the{' '}
                                    <a href="https://swing.tennis" target="_blank" rel="noreferrer">
                                        SwingVision
                                    </a>{' '}
                                    app to your Apple Watch. It&apos;s free for score tracking.
                                    <div className={style.swingVision} />
                                </li>
                                <li>
                                    Track the score by recording each match point. It&apos;s as easy as swiping just
                                    once after every rally.
                                    <div className={style.swingVisionInterface} />
                                </li>
                                <li>
                                    Open the match on iPhone and copy the shared link.
                                    <div className={style.copyLink} />
                                </li>
                                <li>
                                    Paste the link into this form to get your stats.
                                    <div className={style.paste} />
                                    <div className={style.stats} />
                                </li>
                            </ol>
                        </div>
                    </HiddenText>
                    <Field
                        name="link"
                        label="SwingVision match link"
                        description="Example: https://swing.tennis/matches/xxxxxxxxxxxx"
                        component={Input}
                        spellCheck={false}
                    />
                    <Button isSubmitting={isSubmitting} submittingTitle="Processing stats...">
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

FormAddStats.propTypes = {
    match: PropTypes.object,
    onSubmit: PropTypes.func,
};

export default FormAddStats;
