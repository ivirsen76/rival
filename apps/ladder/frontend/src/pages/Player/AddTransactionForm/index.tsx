import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Select from '@/components/formik/Select';
import Button from '@/components/Button';
import axios from '@/utils/axios';
import notification from '@/components/notification';

const typeOptions = [
    { value: 'refund', label: 'Refund' },
    { value: 'discount', label: 'Discount' },
    { value: 'payment', label: 'Payment' },
    { value: 'product', label: 'Product' },
];

const AddTransactionForm = props => {
    const { user } = props;

    const onSubmit = async values => {
        await axios.put(`/api/payments/${user.id}`, { action: 'addTransaction', ...values });
        await props.onSubmit();

        notification({
            header: 'Success',
            message: 'Transaction has been added',
        });
    };

    return (
        <Formik
            initialValues={{ type: 'refund', description: "Credit for <2024 Summer> - <Men's 4.5 Ladder>" }}
            onSubmit={onSubmit}
        >
            {({ isSubmitting, setFieldValue, values }) => (
                <Form noValidate>
                    <Field
                        name="type"
                        label="Type"
                        options={typeOptions}
                        component={Select}
                        style={{ width: 'auto' }}
                    />
                    <Field name="description" label="Description" component={Input} autoFocus />
                    <Field type="number" name="amount" label="Amount" component={Input} style={{ width: '10rem' }} />
                    <Button isSubmitting={isSubmitting} className="btn btn-primary">
                        Add transaction
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

AddTransactionForm.propTypes = {
    user: PropTypes.object,
    onSubmit: PropTypes.func,
};

export default AddTransactionForm;
