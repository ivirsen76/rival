import * as am4core from '@amcharts/amcharts4/core';
import am4themesAnimated from '@amcharts/amcharts4/themes/animated';
import am4themesDark from '@amcharts/amcharts4/themes/dark';
import { useEffect } from 'react';
import useAppearance from '@/utils/useAppearance';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector, useDispatch } from 'react-redux';
import { updateCurrentUser } from '@/reducers/auth';

const setAppearance = appearance => {
    const currentAppearance = document.documentElement.getAttribute('data-bs-theme');
    if (appearance !== currentAppearance) {
        document.documentElement.setAttribute('data-bs-theme', appearance);
    }

    localStorage.setItem('appearance', appearance);

    // adjust chart colors
    {
        am4core.unuseAllThemes();
        am4core.useTheme(am4themesAnimated);

        if (appearance === 'dark') {
            am4core.useTheme(am4themesDark);
        }
    }
};

const AppearanceChecker = props => {
    const appearance = useAppearance();
    const currentUser = useSelector(state => state.auth.user);
    const dispatch = useDispatch();

    useHotkeys(
        'ctrl+t',
        () => {
            if (!currentUser) {
                return;
            }

            const newAppearance = appearance === 'light' ? 'dark' : 'light';
            dispatch(updateCurrentUser({ appearance: newAppearance }, { optimisticUpdate: true, saveUser: false }));
        },
        [appearance, currentUser]
    );

    useEffect(() => {
        setAppearance(appearance);
    }, [appearance]);

    return null;
};

export default AppearanceChecker;
