import { Formik, Field, Form } from '@/components/formik';
import Button from '@rival/packages/components/Button';
import axios from '@/utils/axios';
import TeamNamePicker, { getValidateTeamName } from '@/components/formik/TeamNamePicker';
import useConfig from '@/utils/useConfig';

type FormChangeTeamNameProps = {
    playerId: number;
    tournament: object;
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const FormChangeTeamName = (props: FormChangeTeamNameProps) => {
    const { playerId, tournament, initialValues, onSubmit } = props;
    const config = useConfig();

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={async (values) => {
                await axios.put(`/api/players/${playerId}`, {
                    action: 'changeTeamName',
                    teamName: values.teamName,
                });
                await onSubmit();
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field
                        name="teamName"
                        component={TeamNamePicker}
                        tournamentId={tournament.id}
                        validate={getValidateTeamName(config)}
                    />

                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormChangeTeamName;
