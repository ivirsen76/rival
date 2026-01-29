import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadCurrentUser } from '@/reducers/auth';
import { Formik, Field, Form } from '@/components/formik';
import PlayerName from '@/components/PlayerName';
import notification from '@/components/notification';
import CheckboxArray from '@/components/formik/CheckboxArray';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import Button from '@rival/common/components/Button';
import axios from '@/utils/axios';

type AvoidedPlayersFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
};

const AvoidedPlayersForm = (props: AvoidedPlayersFormProps) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    const possiblePlayers = useMemo(() => {
        return Object.values(user.complainedUsers)
            .sort(compareFields('firstName', 'lastName'))
            .map((item) => ({
                value: item.id,
                label: <PlayerName player1={item} />,
                ...item,
            }));
    }, []);

    const initialValues = {
        avoidedUsers: possiblePlayers.filter((item) => item.avoid).map((item) => item.id),
    };
    const onSubmit = async (values) => {
        await axios.put('/api/users/0', { action: 'avoidPlayers', ...values });
        await dispatch(loadCurrentUser());
        props.onSubmit && props.onSubmit();

        notification({
            header: 'Success',
            message: 'Avoided players are updated.',
        });
    };

    const showIsAvoidedPlayers = (
        <p>
            Avoided players will no longer be able to see one another&apos;s proposals. However, if you meet them in a
            Final Tournament, you must play or face a Default.
        </p>
    );

    if (possiblePlayers.length === 0) {
        return (
            <div>
                {showIsAvoidedPlayers}
                <div>To avoid a player you should submit a complaint in their profile.</div>
            </div>
        );
    }

    return (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    {showIsAvoidedPlayers}
                    <Field
                        label="Avoided players"
                        description="To avoid another player not from this list you should submit a complaint in their player profile."
                        name="avoidedUsers"
                        component={CheckboxArray}
                        options={possiblePlayers}
                    />
                    <div className="mt-8">
                        <Button isSubmitting={isSubmitting}>Submit</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default AvoidedPlayersForm;
