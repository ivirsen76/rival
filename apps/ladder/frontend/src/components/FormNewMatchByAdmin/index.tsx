import { useState, useMemo } from 'react';
import { Formik, Field, Form } from '@rival/common/components/formik';
import Select from '@rival/common/components/formik/Select';
import Button from '@rival/common/components/Button';
import FormMatch from '@/components/FormMatch';

type FormNewMatchByAdminProps = {
    tournament: object;
    onAdd: (...args: unknown[]) => unknown;
};

const FormNewMatchByAdmin = (props: FormNewMatchByAdminProps) => {
    const { tournament, onAdd } = props;
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const [challenger, setChallenger] = useState();
    const [acceptor, setAcceptor] = useState();

    const players = useMemo(() => {
        return [
            { value: 0, label: isDoublesTeam ? '-- Select the team --' : '-- Select the player --' },
            ...Object.values(tournament.players)
                .map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}` }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        ];
    }, [tournament.players]);

    const onSubmit = (values) => {
        setChallenger(tournament.players[values.challengerId]);
        setAcceptor(tournament.players[values.acceptorId]);
    };

    const match = {
        challengerId: challenger && challenger.id,
        acceptorId: acceptor && acceptor.id,
        challengerRank: challenger && challenger.stats.rank,
        acceptorRank: acceptor && acceptor.stats.rank,
        playedAt: '2021-05-03 17:50:47',
        type: 'regular',
    };

    return challenger && acceptor ? (
        <FormMatch tournament={tournament} match={match} onUpdate={onAdd} />
    ) : (
        <Formik
            initialValues={{
                challengerId: 0,
                acceptorId: 0,
            }}
            onSubmit={onSubmit}
        >
            {({ setFieldValue, values }) => (
                <Form noValidate>
                    <Field name="challengerId" label="Challenger" options={players} component={Select} />
                    <Field name="acceptorId" label="Opponent" options={players} component={Select} />
                    <Button
                        disabled={
                            !values.challengerId || !values.acceptorId || values.challengerId === values.acceptorId
                        }
                    >
                        Next
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormNewMatchByAdmin;
