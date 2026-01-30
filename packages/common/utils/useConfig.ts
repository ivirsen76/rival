import useSettings from './useSettings';

export default () => {
    const { settings } = useSettings();
    return settings ? settings.config : {};
};
