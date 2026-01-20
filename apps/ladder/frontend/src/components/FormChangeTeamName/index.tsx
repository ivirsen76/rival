import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import axios from '@/utils/axios';
import TeamNamePicker, { getValidateTeamName } from '@/components/formik/TeamNamePicker';
import useConfig from '@/utils/useConfig';

const FormChangeTeamName = (props) => {
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

FormChangeTeamName.propTypes = {
    playerId: PropTypes.number,
    tournament: PropTypes.object,
    initialValues: PropTypes.object,
    onSubmit: PropTypes.func,
};

export default FormChangeTeamName;
