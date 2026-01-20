/* eslint-disable no-inner-declarations, prefer-rest-params */
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import useSettings from '@/utils/useSettings';

const GoogleAnalytics = props => {
    const { settings } = useSettings();
    const { listen } = useHistory();

    useEffect(() => {
        const { googleAnalyticsTag, isProduction } = settings.config;
        if (!isProduction) {
            return;
        }
        if (!googleAnalyticsTag) {
            return;
        }
        if (window.gtag) {
            return;
        }

        // Include Google Analytics
        {
            const script = document.createElement('script');
            script.async = true;
            script.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsTag}`);
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];

            function gtag() {
                window.dataLayer.push(arguments);
            }
            gtag('js', new Date());
            gtag('config', googleAnalyticsTag);
            gtag('config', 'AW-16852328787');
            window.gtag = gtag;
        }

        // Trigger getting page stats on SPA page changes
        const unlisten = listen(location => {
            window.gtag('set', 'page_path', location.pathname);
            window.gtag('event', 'page_view');
        });

        return unlisten;
    }, [settings, listen]);

    return null;
};

export default GoogleAnalytics;
