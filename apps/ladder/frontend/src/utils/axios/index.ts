import axios from 'axios';
import history from '../../history';
import _isEmpty from 'lodash/isEmpty';
import _set from 'lodash/set';
import notification from '@/components/notification';
import reload from '@/components/ReloadOnUpdate';

axios.interceptors.response.use(response => {
    const serverHash = response.headers['rival-hash'];
    if (serverHash) {
        const clientHash = window.tl?.hash;
        if (clientHash && clientHash !== serverHash) {
            reload();
        } else if (!clientHash) {
            _set(window, 'tl.hash', serverHash);
        }
    }

    return response;
}, null);

axios.interceptors.request.use(config => {
    // add JWT from local storage
    const token = localStorage.getItem('tokenLoginAs') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = token;
    }

    return config;
}, null);

axios.interceptors.response.use(null, error => {
    if (error && error.response) {
        switch (error.response.status) {
            // Validation errors
            case 422: {
                const errors = (error.response.data && error.response.data.errors) || {};

                if (_isEmpty(errors)) {
                    notification({
                        type: 'danger',
                        header: 'Error',
                        message:
                            error.response.data && error.response.data.message
                                ? error.response.data.message
                                : 'Something wrong',
                        duration: 0,
                    });
                }

                return Promise.reject(errors);
            }

            case 429: {
                notification({
                    type: 'danger',
                    header: 'Error',
                    message: 'Too many requests, please try again later.',
                });
                break;
            }

            case 401:
                // we'd like to logout only if it's an internal url and not "authentcation" one
                if (
                    !/^http/.test(error.response.config.url) &&
                    !/api\/authentication$/.test(error.response.config.url)
                ) {
                    history.push('/login');
                }
                break;

            default:
                console.error(error.response.status + ': ' + error.message);
                break;
        }
    }

    return Promise.reject(error);
});

export default axios;
