import { Formik, Field, Form } from '@/components/formik';
import SchedulePicker from '@/components/formik/SchedulePicker';

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
