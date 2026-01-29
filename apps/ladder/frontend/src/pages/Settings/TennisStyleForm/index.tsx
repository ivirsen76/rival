import { useSelector, useDispatch } from 'react-redux';
import { Formik, Field, Form } from '@/components/formik';
import Select from '@/components/formik/Select';
import { updateCurrentUser } from '@/reducers/auth';
import Button from '@rival/common/components/Button';
import _pick from 'lodash/pick';

export const dominantHandOptions = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
];
export const forehandStyleOptions = [
    { value: 'oneHanded', label: 'One-handed' },
    { value: 'twoHanded', label: 'Two-handed' },
];
export const backhandStyleOptions = [
    { value: 'oneHanded', label: 'One-handed' },
    { value: 'twoHanded', label: 'Two-handed' },
];

export const playerTypeOptions = [
    { value: 'aggressiveBaseliner', label: 'Aggressive baseliner' },
    { value: 'defensive', label: 'Defensive' },
    { value: 'counterpuncher', label: 'Counterpuncher' },
    { value: 'allcourt', label: 'All-court player' },
    { value: 'serveandvolley', label: 'Serve-and-volleyer' },
];

export const shotOptions = [
    { value: 'flatserve', label: 'Flat serve' },
    { value: 'kickserve', label: 'Kick serve' },
    { value: 'sliceserve', label: 'Slice serve' },
    { value: 'underhandserve', label: 'Underhand serve' },
    { value: 'topspin', label: 'Topspin' },
    { value: 'slice', label: 'Slice' },
    { value: 'dropshot', label: 'Dropshot' },
    { value: 'volley', label: 'Volley' },
    { value: 'lob', label: 'Lob' },
    { value: 'overhead', label: 'Overhead' },
    { value: 'drivevolley', label: 'Drive volley' },
    { value: 'tweener', label: 'Tweener' },
];

type TennisStyleFormProps = {
    onSubmit: (...args: unknown[]) => unknown;
};

const TennisStyleForm = (props: TennisStyleFormProps) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    return (
        <Formik
            initialValues={_pick(user, ['dominantHand', 'forehandStyle', 'backhandStyle', 'playerType', 'shot'])}
            onSubmit={async (values) => {
                await dispatch(updateCurrentUser(values));
                props.onSubmit && props.onSubmit();
            }}
        >
            {({ isSubmitting }) => (
                <Form noValidate>
                    <Field
                        name="dominantHand"
                        label="Dominant hand"
                        component={Select}
                        options={[{ value: '', label: '-- Choose --' }, ...dominantHandOptions]}
                    />
                    <Field
                        name="forehandStyle"
                        label="Forehand"
                        component={Select}
                        options={[{ value: '', label: '-- Choose --' }, ...forehandStyleOptions]}
                    />
                    <Field
                        name="backhandStyle"
                        label="Backhand"
                        component={Select}
                        options={[{ value: '', label: '-- Choose --' }, ...backhandStyleOptions]}
                    />
                    <Field
                        name="playerType"
                        label="Player type"
                        component={Select}
                        options={[{ value: '', label: '-- Choose --' }, ...playerTypeOptions]}
                    />
                    <Field
                        name="shot"
                        label="Favorite tennis shot"
                        component={Select}
                        options={[{ value: '', label: '-- Choose --' }, ...shotOptions]}
                    />

                    <div className="mt-8">
                        <Button isSubmitting={isSubmitting}>Submit</Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default TennisStyleForm;
