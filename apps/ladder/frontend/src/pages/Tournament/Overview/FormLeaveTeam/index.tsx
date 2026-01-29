import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@rival/packages/components/Button';
import axios from '@/utils/axios';
import { loadCurrentUser } from '@/reducers/auth';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from '@/utils/dayjs';

type FormLeaveTeamProps = {
    onSubmit: (...args: unknown[]) => unknown;
    tournament: object;
};

const FormLeaveTeam = (props: FormLeaveTeamProps) => {
    const { tournament, onSubmit } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser.tournaments[tournament.id].playerId;
    const dispatch = useDispatch();
    const currentDateStr = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    const hasOpenProposals = tournament.matches.some(
        (match) =>
            !match.score &&
            !match.acceptedAt &&
            match.playedAt > currentDateStr &&
            [match.challengerId, match.challenger2Id].includes(currentPlayerId)
    );
    const hasMatchPlayed = tournament.matches.some(
        (match) =>
            match.score &&
            [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id].includes(currentPlayerId)
    );
    const hasUpcomingMatch = tournament.matches.some(
        (match) =>
            match.acceptedAt &&
            !match.score &&
            match.playedAt > currentDateStr &&
            [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id].includes(currentPlayerId)
    );
    if (hasOpenProposals) {
        return <div className="alert alert-danger mb-0">You cannot leave the team as you have an open proposal.</div>;
    }
    if (hasMatchPlayed) {
        return (
            <div className="alert alert-danger mb-0">You cannot leave the team because you already played a match.</div>
        );
    }
    if (hasUpcomingMatch) {
        return (
            <div className="alert alert-danger mb-0">You cannot leave the team because you have an upcoming match.</div>
        );
    }

    return (
        <Formik
            initialValues={{ reason: '' }}
            onSubmit={async (values) => {
                await axios.put(`/api/players/${currentPlayerId}`, {
                    action: 'leaveTeam',
                    reason: values.reason,
                });
                await dispatch(loadCurrentUser());
                await onSubmit();
            }}
        >
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    <Field
                        name="reason"
                        label="Why are you leaving?"
                        description={`Add an explanation, and we'll let the Team Captain know.`}
                        component={Input}
                        autoFocus
                    />
                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormLeaveTeam;
