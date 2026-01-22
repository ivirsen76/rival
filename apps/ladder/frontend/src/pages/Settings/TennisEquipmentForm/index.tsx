import { useSelector, useDispatch } from 'react-redux';
import { Formik, Field, Form } from '@/components/formik';
import Textarea from '@/components/formik/Textarea';
import { updateCurrentUser } from '@/reducers/auth';
import Button from '@/components/Button';
import _pick from 'lodash/pick';

type TennisEquipmentFormProps = {
    onSubmit?: (...args: unknown[]) => unknown;
};

const TennisEquipmentForm = (props: TennisEquipmentFormProps) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    return (
        <Formik
            initialValues={_pick(user, ['racquet', 'strings', 'overgrip', 'shoes', 'bag', 'brand', 'balls'])}
            onSubmit={async (values) => {
                await dispatch(updateCurrentUser(values));
                props.onSubmit && props.onSubmit();
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field
                        name="racquet"
                        label="Racquet"
                        description="Make, Model, Modifications, Grip Size etc."
                        component={Textarea}
                    />
                    <Field
                        name="strings"
                        label="Strings"
                        description="Brand, Tension, Option for hybrids etc."
                        component={Textarea}
                    />
                    <Field name="overgrip" label="Overgrip" component={Textarea} />
                    <Field name="shoes" label="Shoes" component={Textarea} />
                    <Field name="bag" label="Bag" component={Textarea} />
                    <Field name="brand" label="Favorite brand" component={Textarea} />
                    <Field name="balls" label="Favorite Balls" component={Textarea} />

                    <div className="mt-8">
                        <Button isSubmitting={isSubmitting}>Submit</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default TennisEquipmentForm;
