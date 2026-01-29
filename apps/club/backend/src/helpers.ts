import { Unprocessable } from '@feathersjs/errors';

export const getSlug = (str: string) => {
    return str
        .replace(/[^\w-\s]+/g, '')
        .replace(/^\W+/, '')
        .replace(/\W+$/, '')
        .replace(/\W+/g, '-')
        .toLowerCase();
};

export const getSchemaErrors = (schema: any, values: any) => {
    const errors: any = {};

    try {
        schema.validateSync(values, { abortEarly: false, strict: true });
    } catch (err: any) {
        for (const error of err.inner) {
            const field = error.path.replace(/\[.*$/, '');
            if (!errors[field]) {
                errors[field] = error.message;
            }
        }
    }

    return errors;
};

export const throwValidationErrors = (errors: any) => {
    throw new Unprocessable('Invalid request', { errors });
};

export const getMedian = (values: number[]) => {
    if (values.length === 0) {
        throw new Error('No inputs');
    }

    values = [...values];
    values.sort((a, b) => a - b);

    const half = Math.floor(values.length / 2);
    if (values.length % 2) {
        return values[half];
    }

    return Math.round((values[half - 1] + values[half]) / 2);
};

export const generateReferralCode = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const length = 5;

    return new Array(length)
        .fill(0)
        .map((_) => {
            const index = Math.floor(Math.random() * letters.length);
            return letters[index];
        })
        .join('');
};

export const isEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const limitedPromiseAll = async (arr: any[], func: Function, limit = 10) => {
    const results = [];
    for (let i = 0; i < arr.length; i += limit) {
        const batch = arr.slice(i, i + limit);
        const batchResults = await Promise.all(batch.map((item) => func(item)));
        results.push(...batchResults);
    }
    return results;
};
