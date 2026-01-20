import axios from 'axios';
import logger from '@rival-tennis-ladder/logger';

const checkEmail = async (email) => {
    const { TL_SERVICE_URL, TL_SECRET_KEY } = process.env;

    const result = {
        isDeliverable: true,
        message: '',
    };

    if (!TL_SERVICE_URL || !TL_SECRET_KEY) {
        return result;
    }

    const [mailbox, domain] = email.split('@');

    try {
        const response = await axios.get(`${TL_SERVICE_URL}/checkEmail?email=${email}`, {
            headers: { authorization: TL_SECRET_KEY },
        });

        if (['DomainIsWellKnownDea', 'MailExchangerIsWellKnownDea'].includes(response.data.reason)) {
            result.isDeliverable = false;
            result.message =
                'Disposable emails are not allowed. Please use a different email, such as Gmail, Hotmail, Yahoo, etc.';
        } else if (['DomainDoesNotExist'].includes(response.data.reason)) {
            result.isDeliverable = false;
            result.message = `Domain "${domain}" does not exist. Please use a different email, such as Gmail, Yahoo, Hotmail, etc.`;
        } else if (['MailboxDoesNotExist'].includes(response.data.reason)) {
            result.isDeliverable = false;
            result.message = `Mailbox "${mailbox}" does not exist on "${domain}" domain. Please use a different email.`;
        }
    } catch (e) {
        logger.error(e.message);
    }

    return result;
};

export default checkEmail;
