import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import Button from '@rival/packages/components/Button';
import { useSelector } from 'react-redux';
import useConfig from '@/utils/useConfig';
import axios from '@/utils/axios';

type MessageFormProps = {
    user: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const MessageForm = (props: MessageFormProps) => {
    const { user } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();

    const onSubmit = async (values) => {
        await axios.post('/api/messages', values);

        if (props.onSubmit) {
            await props.onSubmit();
        }
    };

    if (currentUser.totalMatches < config.minMatchesToSendMessages) {
        return (
            <div className="alert alert-danger m-0">
                You&apos;re not allowed to send messages until you play at least {config.minMatchesToSendMessages}{' '}
                matches.
            </div>
        );
    }

    if (currentUser.totalMessagesThisWeek >= config.maxMessagesPerWeek) {
        return (
            <div className="alert alert-danger m-0">
                You can only send {config.maxMessagesPerWeek} messages per week. Try again on Monday.
            </div>
        );
    }

    {
        const currentUserTournaments = Object.values(currentUser.tournaments)
            .filter((item) => item.isActive)
            .map((item) => item.tournamentId);

        if (!currentUserTournaments.some((id) => user.currentTournaments.includes(id))) {
            return (
                <div className="alert alert-danger m-0">
                    You can only send messages to players on your current ladders.
                </div>
            );
        }
    }

    return (
        <Formik initialValues={{ recipientId: user.id, message: '' }} onSubmit={onSubmit}>
            {({ isSubmitting, values, setFieldValue }) => (
                <Form noValidate>
                    <Field
                        name="message"
                        label="Message"
                        description={`${user.firstName} will receive this message via email, along with your email and phone number.`}
                        component={Textarea}
                        style={{ minHeight: '10rem' }}
                    />

                    <Button isSubmitting={isSubmitting}>Send</Button>
                </Form>
            )}
        </Formik>
    );
};

export default MessageForm;
