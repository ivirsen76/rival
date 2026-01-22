import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';
import PlayerName from '@/components/PlayerName';
import WarningIcon from '@/styles/metronic/icons/duotone/Code/Warning-2.svg?react';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import dayjs from '@/utils/dayjs';
import useMatchPermissions from '@/utils/useMatchPermissions';

type FormDeleteProposalProps = {
    onSubmit: (...args: unknown[]) => unknown;
    onCancel: (...args: unknown[]) => unknown;
    match: object;
    tournament: object;
    renderDeletedProposal: (...args: unknown[]) => unknown;
};

const FormDeleteProposal = (props: FormDeleteProposalProps) => {
    const { tournament, match, renderDeletedProposal } = props;
    const { isPartOfChallengers } = useMatchPermissions({ tournament, match });

    const acceptor = tournament.players[match.acceptorId];
    const acceptor2 = tournament.players[match.acceptor2Id];
    const isAccepted = Boolean(acceptor || acceptor2);

    const onSubmit = async (values) => {
        await axios.put(`/api/proposals/${match.id}`, { action: 'removeProposal', reason: values.reason });
        await props.onSubmit();

        notification({
            header: 'Success',
            message: isPartOfChallengers ? 'Your proposal has been deleted.' : 'The proposal has been unaccepted.',
        });
    };

    const showWarning = dayjs.tz(match.playedAt).diff(dayjs.tz(), 'day', true) < 1;

    if (!isAccepted) {
        return (
            <Formik initialValues={{}} onSubmit={onSubmit}>
                {({ isSubmitting }) => (
                    <Form noValidate>
                        <div className="mb-6">
                            <p>Please confirm you want to delete this proposal.</p>
                            {renderDeletedProposal()}
                        </div>
                        <div className="d-flex gap-2">
                            <Button isSubmitting={isSubmitting}>Delete</Button>
                            <button type="button" className="btn btn-secondary" onClick={props.onCancel}>
                                Cancel
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        );
    }

    return (
        <Formik initialValues={{ reason: '' }} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    {isPartOfChallengers && (
                        <div className="mb-4">
                            <span className="fw-bold">
                                <PlayerName player1={acceptor} player2={acceptor2} />
                            </span>{' '}
                            already accepted your proposal.
                        </div>
                    )}
                    <Field
                        name="reason"
                        label="Why are you canceling?"
                        description="Add an explanation, and we'll let your opponent know."
                        component={Input}
                        autoFocus
                    />
                    {showWarning && (
                        <div className="alert alert-warning d-flex align-items-center mb-6">
                            <span className="svg-icon svg-icon-3x svg-icon-warning me-4">
                                <WarningIcon />
                            </span>
                            <div>
                                Be aware, your opponent is allowed to report a default if you cancel within 24 hours of
                                the match.
                            </div>
                        </div>
                    )}
                    {isPartOfChallengers ? (
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

export default FormDeleteProposal;
