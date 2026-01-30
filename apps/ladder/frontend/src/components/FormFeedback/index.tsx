import { Formik, Field, Form } from '@rival/common/components/formik';
import Button from '@rival/common/components/Button';
import Textarea from '@rival/common/components/formik/Textarea';
import axios from '@rival/common/axios';
import notification from '@rival/common/components/notification';
import style from './style.module.scss';

const typeOptions = [
    {
        value: 'question',
        title: 'Ask a question',
        comment: 'Ask any question about the ladder',
        label: 'Ask a question',
        icon: (
            <svg viewBox="-40 -40 592 592" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path
                        d="M255.996,384.004c-11.776,0-21.333,9.557-21.333,21.333s9.557,21.333,21.333,21.333c11.776,0,21.333-9.557,21.333-21.333
                S267.772,384.004,255.996,384.004z"
                        fill="currentColor"
                    />
                    <path
                        d="M437.016,74.984c-99.979-99.979-262.075-99.979-362.033,0.002c-99.978,99.978-99.978,262.073,0.004,362.031
                c99.954,99.978,262.05,99.978,362.029-0.002C536.995,337.059,536.995,174.964,437.016,74.984z M406.848,406.844
                c-83.318,83.318-218.396,83.318-301.691,0.004c-83.318-83.299-83.318-218.377-0.002-301.693
                c83.297-83.317,218.375-83.317,301.691,0S490.162,323.549,406.848,406.844z"
                        fill="currentColor"
                    />
                    <path
                        d="M271.295,86.684c-53.025-9.308-100.632,31.063-100.632,83.987c0,11.782,9.551,21.333,21.333,21.333
                s21.333-9.551,21.333-21.333c0-26.507,23.776-46.67,50.584-41.964c16.882,2.968,31.079,17.165,34.048,34.052
                c3.299,18.783-5.487,36.533-21.417,45.315c-26.377,14.544-41.882,43.645-41.882,74.746v37.184
                c0,11.782,9.551,21.333,21.333,21.333c11.782,0,21.333-9.551,21.333-21.333V282.82c0-16.217,7.725-30.716,19.816-37.382
                c31.705-17.479,49.333-53.091,42.839-90.063C333.906,120.803,305.864,92.761,271.295,86.684z"
                        fill="currentColor"
                    />
                </g>
            </svg>
        ),
    },
    {
        value: 'bug',
        title: 'Report a bug',
        comment: "Let us know what's broken",
        label: "Tell us what's broken",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                    d="M192 96c0-35.3 28.7-64 64-64s64 28.7 64 64v32h32V96c0-52.94-43.06-96-96-96S160 43.06 160 96v32h32V96zM496 272h-96V183.7l73.1-59.2C480.9 118.1 482 108.9 476.5 102c-5.516-6.875-15.58-8.016-22.5-2.5L378.4 160H133.6L57.1 99.5C51.11 94 41.03 95.16 35.5 102C29.98 108.9 31.11 118.1 37.1 124.5L112 183.7V272h-96C7.156 272 0 279.2 0 288s7.156 16 16 16h96V352c0 16.95 3.475 33.07 9.486 47.89l-84.8 84.8c-6.25 6.25-6.25 16.38 0 22.62C39.81 510.4 43.91 512 48 512s8.188-1.562 11.31-4.688l78.75-78.75C161.4 459.6 198.3 480 240.1 480H272c41.76 0 78.56-20.4 101.9-51.43l78.75 78.75C455.8 510.4 459.9 512 464 512s8.188-1.562 11.31-4.688c6.25-6.25 6.25-16.38 0-22.62l-84.8-84.8C396.5 385.1 400 368.1 400 352V304h96C504.8 304 512 296.8 512 288S504.8 272 496 272zM368 352c0 52.94-43.06 96-96 96V239.9C272 231.1 264.9 224 256 224S240.1 231.1 240.1 239.9L240 448c-52.94 0-96-43.06-96-96V192h224V352z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        value: 'feature',
        title: 'Feature request',
        comment: 'Tell us how we can improve',
        label: 'Tell us how we can improve',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                <path
                    d="M320 416c8.844 0 16-7.156 16-16v-32h32c8.844 0 16-7.156 16-16s-7.156-16-16-16h-32v-32C336 295.2 328.8 288 320 288S304 295.2 304 304v32h-32C263.2 336 256 343.2 256 352s7.156 16 16 16h32v32C304 408.8 311.2 416 320 416zM80 224C88.84 224 96 216.8 96 208V160h32c8.844 0 16-7.156 16-16S136.8 128 128 128H96V80C96 71.16 88.84 64 80 64S64 71.16 64 80V128H16C7.156 128 .0078 135.2 .0078 143.1S7.156 160 16 160H64v48C64 216.8 71.16 224 80 224zM624 416H576v-48c0-8.844-7.146-16-15.99-16S544 359.2 544 368V416h-48c-8.844 0-15.99 7.152-15.99 15.1S487.2 448 496 448H544v48c0 8.844 7.166 16 16.01 16S576 504.8 576 496V448h48c8.844 0 15.99-7.152 15.99-15.1S632.8 416 624 416zM456.9 459.7C445.1 459.7 428.8 480 383.1 480H282.2c-37.26 0-72.42-18.12-94.36-48.89L101.2 317.2c-3.536-4.652-5.278-10.15-5.278-15.5c0-13.31 10.56-22.41 22.26-22.41c5.763 0 13.05 2.263 18.88 9.938l34.2 44.98c6.248 8.222 15.89 12.87 25.56 12.87c4.032 0 27.2-2.604 27.2-26.13C224 320.7 224 320.3 224 320V88.95c0-12.42 9.247-24.95 24-24.95C261.2 63.1 272 74.77 272 88v151.2c0 2.773 2.19 16.83 16 16.83c8.843 0 15.85-7.157 15.85-16l.1328-152.2c0-.1055 0 .1055 0 0L303.1 56.95c0-12.42 9.247-24.95 24.01-24.95c13.24 0 24 10.77 24 24v183.2c0 2.773 2.205 16.83 16.02 16.83c8.845 0 15.94-7.157 15.94-16l.0439-151.1c0-12.42 9.248-24.95 24-24.95c13.24 0 24 10.77 24 24v150.7c0 2.773 2.188 16.84 16 16.84c8.845 0 16-7.155 16-15.1V136.3c0-12.48 9.295-24.98 24-24.98c13.23 0 24 10.8 24 24.06V300.1c0 8.822 7.152 15.97 15.97 15.97S544 308.9 544 300.1V137.4c0-21.74-16.47-58.06-56.01-58.06c-8.624 0-16.8 1.954-24.09 5.454C462.2 55.38 437.8 32 407.1 32c-9.658 0-18.77 2.469-26.71 6.781C373.1 16.3 352.7 0 327.8 0C302.9 0 282.1 16.55 274.9 39.17c-8.012-4.43-17.08-7.174-26.87-7.174C208.4 31.1 192 68.61 192 90.79v217.1l-30.24-39c-10.27-13.43-26.38-21.52-43.31-21.52c-29.56 0-54.45 23.06-54.45 54.46c0 12.14 3.856 24.46 11.72 34.79l86.36 113.5C189.7 488.9 234.6 512 282.2 512h101.8c32.16 0 88.77-15.15 88.77-36.42C472.8 469.5 468.1 459.7 456.9 459.7z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        value: 'general',
        title: 'General feedback',
        comment: 'Give general feedback of this site',
        label: 'Leave us your comment',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                <path
                    d="M365.3 125.3l-106.5-106.5C246.7 6.742 230.5 0 213.5 0L64-.0001c-35.35 0-64 28.65-64 64l.0065 384c0 35.35 28.65 64 64 64H320c35.35 0 64-28.65 64-64v-277.5C384 153.5 377.3 137.3 365.3 125.3zM224 34.08c4.477 1.566 8.666 3.846 12.12 7.299l106.5 106.5C346.1 151.3 348.4 155.5 349.9 160H240C231.2 160 224 152.8 224 144V34.08zM352 448c0 17.64-14.36 32-32 32H64c-17.64 0-32-14.36-32-32V64c0-17.64 14.36-32 32-32h128v112C192 170.5 213.5 192 240 192H352V448zM96 272C96 280.8 103.2 288 112 288h160C280.8 288 288 280.8 288 272S280.8 256 272 256h-160C103.2 256 96 263.2 96 272zM272 320h-160C103.2 320 96 327.2 96 336S103.2 352 112 352h160c8.838 0 16-7.164 16-16S280.8 320 272 320zM272 384h-160C103.2 384 96 391.2 96 400S103.2 416 112 416h160c8.838 0 16-7.164 16-16S280.8 384 272 384z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
];

type FormFeedbackProps = {
    onSubmit: (...args: unknown[]) => unknown;
};

const FormFeedback = (props: FormFeedbackProps) => {
    const { onSubmit } = props;

    const handleSubmit = async (values) => {
        await axios.post('/api/feedbacks', {
            ...values,
            description: values.description,
            userAgent: navigator.userAgent,
        });

        notification({
            message: 'Thank you! We really appreciate your feedback.',
        });

        await onSubmit(values);
    };

    return (
        <Formik initialValues={{ type: '', description: '' }} onSubmit={handleSubmit}>
            {({ isSubmitting, values, setFieldValue }) => {
                const currentType = typeOptions.find((type) => type.value === values.type);

                return (
                    <Form noValidate>
                        {currentType ? (
                            <>
                                <Field
                                    name="description"
                                    label={currentType.label}
                                    component={Textarea}
                                    style={{ minHeight: '12rem' }}
                                    autoFocus
                                />
                                <Button isSubmitting={isSubmitting}>Submit</Button>
                            </>
                        ) : (
                            <div className={style.list}>
                                {typeOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={style.type}
                                        onClick={() => setFieldValue('type', option.value)}
                                        data-type={option.value}
                                    >
                                        <div>{option.icon}</div>
                                        <div>
                                            <h4 className="mb-2">{option.title}</h4>
                                            <div className="text-gray-700">{option.comment}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Form>
                );
            }}
        </Formik>
    );
};

export default FormFeedback;
