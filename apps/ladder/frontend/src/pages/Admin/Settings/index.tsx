import Card from '@/components/Card';
import { useQuery, useQueryClient } from 'react-query';
import axios from '@/utils/axios';
import Loader from '@/components/Loader';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';
import notification from '@/components/notification';
import useConfig from '@/utils/useConfig';

const Settings = props => {
    const queryClient = useQueryClient();
    const config = useConfig();

    const { data: settings, isLoading } = useQuery('/api/settings/1', async () => {
        const response = await axios.get('/api/settings/1');
        return response.data;
    });

    const updateSettings = async values => {
        await axios.patch('/api/settings/1', values);
        await queryClient.invalidateQueries('/api/settings/1');
        notification({
            header: 'Success',
            message: 'Settings updated successfully',
        });
    };

    if (isLoading) {
        return <Loader loading />;
    }

    return (
        <Card>
            <Formik initialValues={settings} onSubmit={updateSettings}>
                {({ isSubmitting }) => (
                    <Form noValidate>
                        <Field
                            name="signUpNotification"
                            label="Sign-up notification"
                            component={Input}
                            description="These emails will receive a notification when new players sign up. Separate emails with a semicolon."
                        />
                        <Field
                            name="changeLevelNotification"
                            label="Change level notification"
                            component={Input}
                            description="These emails will receive a notification when a player switches to a different level. Separate emails with a semicolon."
                        />
                        {!config.isRaleigh ? (
                            <Field
                                name="newFeedbackNotification"
                                label="New feedback notification"
                                component={Input}
                                description="These emails will receive a notification when a player report a feedback. Separate emails with a semicolon."
                            />
                        ) : null}
                        <Field
                            name="newComplaintNotification"
                            label="New complaint notification"
                            component={Input}
                            description="These emails will receive a notification when a player report a complaint. Separate emails with a semicolon."
                        />

                        <Button isSubmitting={isSubmitting}>Submit</Button>
                    </Form>
                )}
            </Formik>
        </Card>
    );
};

export default Settings;
