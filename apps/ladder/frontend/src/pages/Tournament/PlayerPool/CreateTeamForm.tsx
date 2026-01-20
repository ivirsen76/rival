import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import TeamNamePicker, { getValidateTeamName } from '@/components/formik/TeamNamePicker';
import useConfig from '@/utils/useConfig';
import Button from '@/components/Button';

const CreateTeamForm = props => {
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

CreateTeamForm.propTypes = {
    tournament: PropTypes.object,
    player: PropTypes.object,
    onSubmit: PropTypes.func,
};

export default CreateTeamForm;
