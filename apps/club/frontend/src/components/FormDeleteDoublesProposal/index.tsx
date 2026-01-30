import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Button from '@rival/common/components/Button';
import axios from '@rival/common/axios';
import { useSelector } from 'react-redux';
import notification from '@rival/common/components/notification';

type FormDeleteDoublesProposalProps = {
    onSubmit: (...args: unknown[]) => unknown;
    match: object;
    tournament: object;
};

const FormDeleteDoublesProposal = (props: FormDeleteDoublesProposalProps) => {
    const { match, tournament } = props;
    const { players } = tournament;
    const currentUser = useSelector((state) => state.auth.user);
    const challenger = players[match.challengerId];
    const challenger2 = match.challenger2Id ? players[match.challenger2Id] : null;
    const acceptor = match.acceptorId ? players[match.acceptorId] : null;
    const acceptor2 = match.acceptor2Id ? players[match.acceptor2Id] : null;

    const isChallenger = currentUser.id === challenger.userId;

    const onSubmit = async (values) => {
        await axios.put(`/api/proposals/${match.id}`, { action: 'removeDoublesProposal', reason: values.reason });
        await props.onSubmit();

        notification({
            header: 'Success',
            message: isChallenger ? 'Your proposal has been deleted.' : 'The proposal has been unaccepted.',
        });
    };

    let acceptors = [challenger2, acceptor, acceptor2]
        .filter((player) => player)
        .map((player) => `${player.firstName} ${player.lastName}`);
    acceptors = acceptors.join(', ').replace(/,([^,]+)$/, acceptors.length > 2 ? ', and$1' : ' and$1');

    return (
        <Formik initialValues={{ reason: '' }} onSubmit={onSubmit}>
            {({ isSubmitting, setFieldValue, values }) => (
                <Form noValidate>
                    {isChallenger && (
                        <div className="mb-4">
                            <span className="fw-bold">{acceptors}</span> already accepted your proposal.
                        </div>
                    )}
                    <Field
                        name="reason"
                        label="Why are you canceling?"
                        description={`Add an explanation, and we'll let ${isChallenger ? 'them' : 'everyone'} know.`}
                        component={Input}
                        autoFocus
                    />
                    {isChallenger ? (
                        <Button isSubmitting={isSubmitting} className="btn btn-danger">
                            Delete proposal
                        </Button>
                    ) : (
                        <Button isSubmitting={isSubmitting} className="btn btn-warning">
                            Unaccept proposal
                        </Button>
                    )}
                </Form>
            )}
        </Formik>
    );
};

export default FormDeleteDoublesProposal;
