import { Formik, Field, Form } from '@rival/common/components/formik';
import SchedulePicker from '@rival/common/components/formik/SchedulePicker';

const FormWeeklySchedule = (props) => {
    const handleSubmit = async (values) => {
        // do nothing
    };

    return (
        <Formik initialValues={{ schedule: [[], [], [], [], [], [], []] }} onSubmit={handleSubmit}>
            {({ setFieldValue }) => (
                <Form noValidate>
                    <Field
                        name="schedule"
                        label="You time availability:"
                        component={SchedulePicker}
                        days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                    />
                </Form>
            )}
        </Formik>
    );
};

export default FormWeeklySchedule;
