import { Formik, Field, Form } from '@/components/formik';
import RadioModern from '@/components/formik/RadioModern';
import Button from '@/components/Button';
import PlayerName from '@/components/PlayerName';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import dayjs from '@/utils/dayjs';

const decisionOptions = [
    { value: 'nothing', label: 'Nothing', maxCheatingAttempts: -1 },
    {
        value: 'info',
        label: 'Send merging notification',
        maxCheatingAttempts: 0,
    },
    {
        value: 'warning',
        label: 'Send warning about cheating',
        description: 'User will be removed/disabled from the current ladder',
        maxCheatingAttempts: 99,
    },
    // { value: 'temporaryBan', label: 'Ban user for 3 months' },
    // { value: 'foreverBan', label: 'Ban user forever' },
];

type FormMergeProps = {
    duplicates: unknown[];
    userIdTo: number;
    userIdFrom: number;
    onSubmit: (...args: unknown[]) => unknown;
    hide: (...args: unknown[]) => unknown;
};

const FormMerge = (props: FormMergeProps) => {
    const { duplicates, userIdTo, userIdFrom, hide } = props;
    const userTo = duplicates.find((item) => item.id === userIdTo);
    const userFrom = duplicates.find((item) => item.id === userIdFrom);

    const cheatingAttempts = userTo.cheatingAttempts + userFrom.cheatingAttempts;
    const initialDecision = (() => {
        const totalCheatingAttempts = cheatingAttempts + (userTo.isCheater ? 1 : 0);
        const monthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD');
        if (
            totalCheatingAttempts === 0 &&
            (!userFrom.loggedAt || userFrom.loggedAt < monthAgo) &&
            (!userTo.loggedAt || userTo.loggedAt < monthAgo)
        ) {
            return 'nothing';
        }

        return decisionOptions.find((item) => totalCheatingAttempts <= item.maxCheatingAttempts).value;
    })();

    const handleSubmit = async (values) => {
        await axios.put('/api/users/0', { action: 'mergeUsers', userIdTo, userIdFrom, ...values });
        await props.onSubmit(values);

        notification({
            header: 'Success',
            message: 'The user has been merged.',
        });
    };

    return (
        <Formik initialValues={{ decision: initialDecision }} onSubmit={handleSubmit}>
            {({ isSubmitting, values, setFieldValue }) => (
                <Form noValidate>
                    <h2>
                        <PlayerName player1={userTo} />
                        {userTo.isCheater ? (
                            <>
                                <span> - </span>
                                <span className="text-danger fw-bold">Possible Cheater!</span>
                            </>
                        ) : null}
                    </h2>
                    <div className="mb-4">
                        Previous cheating attempts: <b>{cheatingAttempts}</b>
                    </div>
                    <Field
                        name="decision"
                        label="What else to do with this user?"
                        component={RadioModern}
                        options={decisionOptions}
                        alwaysShowDescription
                        allowUnselect={false}
                    />
                    <div className="d-flex gap-2">
                        <Button isSubmitting={isSubmitting}>Merge</Button>
                        <button type="button" className="btn btn-secondary" onClick={hide}>
                            Cancel
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default FormMerge;
