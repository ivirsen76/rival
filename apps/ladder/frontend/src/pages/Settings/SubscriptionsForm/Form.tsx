import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Checkbox from '@/components/formik/Checkbox';
import SchedulePicker from '@/components/formik/SchedulePicker';
import ButtonRow from '@/components/formik/ButtonRow';
import Button from '@/components/Button';
import _pick from 'lodash/pick';
import matchFormatOptions from '@rival/ladder.backend/src/services/proposals/matchFormatOptions';
import { useSelector } from 'react-redux';

const formatOptions = [
    ...matchFormatOptions.map((item) => _pick(item, ['value', 'label'])),
    { value: 99, label: 'Practice' },
];

const JustForm = (props) => {
    const user = useSelector((state) => state.auth.user);
    const showCompetitiveProposalsCheckbox = Boolean(!user || user.establishedElo);

    return (
        <Formik initialValues={props.initialValues} onSubmit={props.onSubmit}>
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    <Field name="subscribeForProposals" label="New proposals" component={Checkbox} />
                    {values.subscribeForProposals ? (
                        <div className="ms-8">
                            <Field
                                name="information.subscribeForProposals.playFormats"
                                label="Send proposals with these play formats:"
                                component={ButtonRow}
                                options={formatOptions}
                            />
                            <Field
                                name="information.subscribeForProposals.onlyNotPlaying"
                                label="Send only if I'm not playing at that day"
                                component={Checkbox}
                            />
                            {showCompetitiveProposalsCheckbox && (
                                <Field
                                    name="information.subscribeForProposals.onlyCompetitive"
                                    label="Send only competitive proposals"
                                    description="TLR 0.25 above or below my level"
                                    component={Checkbox}
                                />
                            )}
                            <Field
                                name="information.subscribeForProposals.onlyAgeCompatible"
                                label="Send only age suitable proposals"
                                description="Players 15 years younger or older"
                                component={Checkbox}
                            />
                            <Field
                                name="information.subscribeForProposals.onlyMySchedule"
                                label="Send only if it fits my weekly schedule"
                                description={
                                    values.information.subscribeForProposals.onlyMySchedule
                                        ? null
                                        : 'We will ask for your availability.'
                                }
                                component={Checkbox}
                            />
                            {values.information.subscribeForProposals.onlyMySchedule ? (
                                <Field
                                    name="information.subscribeForProposals.weeklySchedule"
                                    label="My weekly availability:"
                                    description="Proposals sent based on estimated match length"
                                    component={SchedulePicker}
                                    days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                                />
                            ) : null}
                        </div>
                    ) : null}
                    <Field
                        name="subscribeForReminders"
                        label="Reminders"
                        description="About the final tournament, a new season, etc."
                        component={Checkbox}
                    />
                    <Field
                        name="subscribeForNews"
                        label="Ladder announcements"
                        description="News, updates, etc."
                        component={Checkbox}
                    />
                    <Field
                        name="subscribeForBadges"
                        label="Badges updates"
                        description="Notifications about new badges"
                        component={Checkbox}
                    />

                    <div className="mt-8">
                        <Button isSubmitting={isSubmitting}>{props.buttonTitle}</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

JustForm.propTypes = {
    onSubmit: PropTypes.func,
    initialValues: PropTypes.object,
    buttonTitle: PropTypes.string,
};

JustForm.defaultProps = {
    buttonTitle: 'Submit',
};

export default JustForm;
