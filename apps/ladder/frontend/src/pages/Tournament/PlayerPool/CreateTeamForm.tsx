import { Formik, Field, Form } from '@/components/formik';
import TeamNamePicker, { getValidateTeamName } from '@/components/formik/TeamNamePicker';
import useConfig from '@/utils/useConfig';
import Button from '@/components/Button';

type CreateTeamFormProps = {
    tournament?: object;
    player?: object;
    onSubmit?: (...args: unknown[]) => unknown;
};

const CreateTeamForm = (props: CreateTeamFormProps) => {
    const { tournament, player, onSubmit } = props;
    const playerName = `${player.firstName} ${player.lastName}`;
    const config = useConfig();

    return (
        <Formik initialValues={{ teamName: '' }} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate>
                    <div className="alert alert-primary mb-8">
                        By adding <b>{playerName}</b> to your Doubles Team, you will become a Team Captain.
                    </div>

                    <Field
                        name="teamName"
                        component={TeamNamePicker}
                        tournamentId={tournament.id}
                        validate={getValidateTeamName(config)}
                    />

                    <div className="mt-8">
                        <Button isSubmitting={isSubmitting}>Create Team</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default CreateTeamForm;
