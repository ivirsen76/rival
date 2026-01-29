// @ts-nocheck
import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';

const checkEmailList = (list) => {
    if (!list) {
        return true;
    }

    const schema = yup.object().shape({
        email: yup.string().required('Email is required').email(),
    });

    try {
        list.replace(/\s+/g, '')
            .split(';')
            .forEach((email) => {
                schema.validateSync({ email });
            });
    } catch {
        return false;
    }

    return true;
};

export default (values) => {
    const schema = yup.object().shape({
        signUpNotification: yup.string().max(200),
        changeLevelNotification: yup.string().max(200),
        newFeedbackNotification: yup.string().max(200),
        newComplaintNotification: yup.string().max(200),
    });

    const errors = getSchemaErrors(schema, values);
    if (Object.keys(errors).length === 0) {
        if (!checkEmailList(values.signUpNotification)) {
            errors.signUpNotification = 'The email list is incorrect.';
        }
        if (!checkEmailList(values.changeLevelNotification)) {
            errors.changeLevelNotification = 'The email list is incorrect.';
        }
        if (!checkEmailList(values.newFeedbackNotification)) {
            errors.newFeedbackNotification = 'The email list is incorrect.';
        }
        if (!checkEmailList(values.newComplaintNotification)) {
            errors.newComplaintNotification = 'The email list is incorrect.';
        }
    }

    return errors;
};
