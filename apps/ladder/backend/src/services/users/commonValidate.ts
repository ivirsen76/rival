import yup from '../../packages/yup';
import { getSchemaErrors } from '../../helpers';
import dayjs from '../../utils/dayjs';
import { getAge } from '../../utils/helpers';

const nameRegex = /^[a-zA-Z-.' ]+$/;

export default (values) => {
    const schema = yup.object().shape({
        firstName: yup
            .string()
            .required('First name is required')
            .matches(nameRegex, 'First name should contain only letters.')
            .min(2, 'Minimum 2 letters')
            .max(20),
        lastName: yup
            .string()
            .required('Last name is required')
            .matches(nameRegex, 'Last name should contain only letters.')
            .min(2, 'Minimum 2 letters')
            .max(20),
        email: yup.string().required('Email is required').email(),
        gender: yup.string().oneOf(['', 'male', 'female']),
        password: yup.string().min(8, 'Password must be at least 8 characters').max(20),
        personalInfo: yup.string().nullable().max(500),
        dominantHand: yup.string().nullable().max(250),
        forehandStyle: yup.string().nullable().max(250),
        backhandStyle: yup.string().nullable().max(250),
        playerType: yup.string().nullable().max(250),
        shot: yup.string().nullable().max(250),
        racquet: yup.string().nullable().max(250),
        strings: yup.string().nullable().max(250),
        shoes: yup.string().nullable().max(250),
        bag: yup.string().nullable().max(250),
        brand: yup.string().nullable().max(250),
        overgrip: yup.string().nullable().max(250),
        balls: yup.string().nullable().max(250),
        referralCode: yup
            .string()
            .nullable()
            .matches(/^[a-z0-9]{5}$/),
        registerHistory: yup.array(),
        zip: yup
            .string()
            .nullable()
            .matches(/^(\d{5})?$/, 'ZIP code is invalid'),
        showAge: yup.boolean(),
        information: yup.object().shape({
            subscribeForProposals: yup.object().shape({
                playFormats: yup.array(yup.number().oneOf([0, 1, 2, 99])),
                onlyNotPlaying: yup.boolean(),
                onlyCompetitive: yup.boolean(),
                onlyAgeCompatible: yup.boolean(),
                onlyMySchedule: yup.boolean(),
                weeklySchedule: yup.array(yup.array().max(6)).length(7),
            }),
        }),
    });

    const errors = getSchemaErrors(schema, values);

    if (!values.birthday) {
        errors.birthday = 'Birth date is required';
    } else {
        const date = dayjs(values.birthday, 'YYYY-MM-DD', true);
        if (!date.isValid()) {
            errors.birthday = 'Date is incorrect.';
        } else {
            const age = getAge(values.birthday);
            if (age < 0) {
                errors.birthday = 'The date is in the future.';
            } else if (age < 18) {
                errors.birthday = 'You must be at least 18 years old.';
            } else if (age > 100) {
                errors.birthday = 'You cannot be over 100 years old.';
            }
        }
    }

    return errors;
};
