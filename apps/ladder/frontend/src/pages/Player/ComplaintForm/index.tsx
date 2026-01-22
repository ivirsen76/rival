import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import Checkbox from '@/components/formik/Checkbox';
import RadioModern from '@/components/formik/RadioModern';
import Button from '@/components/Button';
import HiddenText from '@/components/HiddenText';
import reasonOptions from '@rival/ladder.backend/src/services/complaints/reasonOptions';
import reasonDescriptions from './reasonDescriptions';

const adjustedReasonOptions = reasonOptions.map((item) => ({
    ...item,
    description: reasonDescriptions[item.value],
}));

type ComplaintFormProps = {
    user: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const ComplaintForm = (props: ComplaintFormProps) => {
    const { user, onSubmit } = props;

    return (
        <Formik initialValues={{ opponentId: user.id, reason: '', description: '', avoid: false }} onSubmit={onSubmit}>
            {({ isSubmitting, values, setFieldValue }) => (
                <Form noValidate>
                    <HiddenText title="How do complaints work?" contentClassName="mb-6">
                        <div>
                            <p>
                                We collect complaints internally to track dissatisfaction with certain players based on
                                community feedback. We <b>do not share your complaints</b> with players directly.
                            </p>
                            <p>
                                If a player receives numerous complaints about their behavior, we will notify them and
                                offer a warning. If this behavior does not improve and players continue to complain, the
                                player will face suspension and an eventual ban from the system.
                            </p>
                            <div>
                                While we strive to keep all complaints anonymous, players could still guess who made the
                                complaints initially based on the category of complaint and the nature of the
                                explanation. So, please keep that in mind as you fill out the form.
                            </div>
                        </div>
                    </HiddenText>
                    <HiddenText title="What shouldn't you complain about?" className="mb-6">
                        <p>
                            While there are several valid reasons to complain about players, not all situations require
                            a formal complaint. Here are some situations where you should refrain from submitting a
                            complaint:
                        </p>
                        <ul className="mb-0 ps-8">
                            <li>
                                <div className="fw-bold">Non-aggressive verbal utterances</div>
                                <div>
                                    Players may, from time to time, grunt, yell “Come On,” or express their emotions in
                                    a regular fashion on the court. Unless it&apos;s excessive, it&apos;s normal tennis
                                    behavior.
                                </div>
                            </li>
                            <li>
                                <div className="fw-bold">Occasional bad behavior</div>
                                <div>
                                    Nobody is perfect. If your opponent is occasionally late, doesn&apos;t bring new
                                    balls once, or gets upset during one occasion, it&apos;s best to let it go unless it
                                    becomes a recurring issue.
                                </div>
                            </li>
                            <li>
                                <div className="fw-bold">Preferring match tiebreak</div>
                                <div>
                                    Some players simply do not have the time or endurance to play a full third set.
                                    While we ask that both players agree on match tiebreaks before the match, it&apos;s
                                    not against the rules to prefer a tiebreak over a third set.
                                </div>
                            </li>
                            <li>
                                <div className="fw-bold">Honest mistakes</div>
                                <div>
                                    There are a lot of rules in tennis, and people can make mistakes. If a player
                                    accidentally miscalls a line or doesn&apos;t know about a rule, forgive them instead
                                    of issuing a complaint.
                                </div>
                            </li>
                        </ul>
                    </HiddenText>

                    <Field
                        name="reason"
                        label="What are you complaining about?"
                        component={RadioModern}
                        options={adjustedReasonOptions}
                    />
                    <Field
                        name="description"
                        label="Describe your issue in further detail"
                        component={Textarea}
                        style={{ minHeight: '10rem' }}
                    />
                    <Field
                        name="avoid"
                        label={<div className="fw-semibold">Avoid playing with {user.firstName}</div>}
                        description={`By checking this box, you and ${user.firstName} will no longer be able to see one another's proposals. However, if you meet in a Final Tournament, you must play or face a Default.`}
                        component={Checkbox}
                    />

                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default ComplaintForm;
