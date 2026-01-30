import { Formik, Field, Form } from '@rival/common/components/formik';
import Button from '@rival/common/components/Button';
import Select from '@rival/common/components/formik/Select';
import Copy from '@rival/common/components/Copy';
import axios from '@rival/common/axios';
import notification from '@rival/common/components/notification';

const percentOptions = [
    { value: 10, label: '10%' },
    { value: 20, label: '20%' },
    { value: 30, label: '30%' },
    { value: 40, label: '40%' },
    { value: 50, label: '50%' },
];

const yearsOptions = [
    { value: 3, label: '3 years' },
    { value: 4, label: '4 years' },
    { value: 5, label: '5 years' },
];

type FormGeneratePartnerLinkProps = {
    hide: (...args: unknown[]) => unknown;
};

const FormGeneratePartnerLink = (props: FormGeneratePartnerLinkProps) => {
    const handleSubmit = async (values) => {
        const result = await axios.put('/api/utils/0', { action: 'generatePartnerLink', ...values });
        const link = result.data.link;

        props.hide();

        notification({
            inModal: true,
            message: (
                <div className="d-flex flex-column align-items-center">
                    <div>Link:</div>
                    <Copy label={<a href={link}>{link}</a>} stringToCopy={link} />
                </div>
            ),
        });
    };

    return (
        <Formik initialValues={{ percent: 30, years: 5 }} onSubmit={handleSubmit}>
            {({ isSubmitting, values, setFieldValue }) => (
                <Form noValidate>
                    <Field
                        name="percent"
                        label="Percent"
                        options={percentOptions}
                        component={Select}
                        style={{ width: 'auto' }}
                    />
                    <Field
                        name="years"
                        label="Years"
                        options={yearsOptions}
                        component={Select}
                        style={{ width: 'auto' }}
                    />
                    <Button isSubmitting={isSubmitting}>Generate</Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormGeneratePartnerLink;
