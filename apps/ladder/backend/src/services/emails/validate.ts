// @ts-nocheck
import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';

export default (values) => {
    const schema = yup.object().shape({
        from: yup.object().shape({
            name: yup.string().max(50),
            email: yup.string().required().email(),
        }),
        to: yup
            .array(
                yup.object().shape({
                    name: yup.string().max(50),
                    email: yup.string().required().email(),
                })
            )
            .max(5000),
        cc: yup
            .array(
                yup.object().shape({
                    name: yup.string().max(50),
                    email: yup.string().required().email(),
                })
            )
            .max(1000),
        bcc: yup
            .array(
                yup.object().shape({
                    name: yup.string().max(50),
                    email: yup.string().required().email(),
                })
            )
            .max(1000),
        subject: yup.string().required(),
        text: yup.string(),
        html: yup.string(),
        replyTo: yup.object().shape({
            name: yup.string().max(50),
            email: yup.string().required().email(),
        }),
    });

    const errors = getSchemaErrors(schema, values);

    return errors;
};
