import { createSlice } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import dayjs from '@/utils/dayjs';
import getPaw from '../utils/getPaw';

const REGISTER_HISTORY_KEY = 'registerHistory';

const authSlice = createSlice({
    name: 'auth',
    initialState: () => {
        const history = (() => {
            try {
                const saved = localStorage.getItem(REGISTER_HISTORY_KEY);
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch {
                // do nothing
            }

            return [];
        })();

        return {
            user: null,
            ui: {
                showAllPlayersForTournaments: [],
            },
            config: null,
            history,
        };
    },
    reducers: {
        setCurrentUser: (state, action) => {
            state.user = {
                ...state.user,
                ...action.payload.user,
            };
        },
        unsetCurrentUser: (state) => {
            state.user = null;
        },
        setShowAllPlayers: (state, action) => {
            state.ui.showAllPlayersForTournaments.push(action.payload);
        },
        setConfig: (state, action) => {
            state.config = action.payload;
        },
        addHistoryEvent: (state, action) => {
            const time = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
            state.history.push({ ...action.payload, time });
        },
        clearHistory: (state, action) => {
            state.history = [];
        },
        incrementUserMessages: (state, action) => {
            state.user.totalMessagesThisWeek++;
        },
    },
});

export const { setCurrentUser, unsetCurrentUser, setShowAllPlayers, setConfig, incrementUserMessages } =
    authSlice.actions;

export const logout = () => async (dispatch, getState) => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenLoginAs');
    dispatch(unsetCurrentUser());

    // Invalidate all queries just to not contain logged in user information
    if (window.tl && window.tl.queryClient) {
        window.tl.queryClient.invalidateQueries();
    }
};

export const addHistoryEventAndSave = (payload) => async (dispatch, getState) => {
    const { user } = getState().auth;
    if (user) {
        return;
    }

    dispatch(authSlice.actions.addHistoryEvent(payload));
    const { history } = getState().auth;

    localStorage.setItem(REGISTER_HISTORY_KEY, JSON.stringify(history));
};

export const clearHistoryAndSave = () => async (dispatch, getState) => {
    dispatch(authSlice.actions.clearHistory());
    localStorage.removeItem(REGISTER_HISTORY_KEY);
};

export const loadCurrentUser = () => async (dispatch, getState) => {
    const tokenName = localStorage.getItem('tokenLoginAs') ? 'tokenLoginAs' : 'token';
    const token = localStorage.getItem(tokenName);
    if (token) {
        try {
            const result = await axios.post('/api/authentication', { strategy: 'jwt', accessToken: token });
            localStorage.setItem(tokenName, result.data.accessToken);
            dispatch(setCurrentUser({ user: result.data.user }));
            dispatch(clearHistoryAndSave());
        } catch (e) {
            dispatch(logout());
        }
    }
};

export const updateCurrentUser =
    (data, { optimisticUpdate = false, saveUser = true } = {}) =>
    async (dispatch, getState) => {
        const { user } = getState().auth;

        if (optimisticUpdate) {
            dispatch(setCurrentUser({ user: { ...user, ...data } }));
        }

        if (saveUser) {
            const result = await axios.patch(`/api/users/${user.id}`, data);
            dispatch(setCurrentUser({ user: result.data }));

            // Invalidate all queries because they could contain user information
            if (window.tl && window.tl.queryClient) {
                window.tl.queryClient.invalidateQueries();
            }
        }
    };

export const savePaw = () => async (dispatch, getState) => {
    try {
        const paw = await getPaw();
        await axios.put('/api/users/0', { action: 'savePaw', ...paw });
        await dispatch(loadCurrentUser());
    } catch {
        // do nothing
    }
};

export const authenticate = (email: string, password: string) => async (dispatch, getState) => {
    try {
        const result = await axios.post('/api/authentication', { strategy: 'local', email, password });
        localStorage.setItem('token', result.data.accessToken);
        dispatch(setCurrentUser({ user: result.data.user }));
        dispatch(clearHistoryAndSave());
        dispatch(savePaw());
        return result.data.user;
    } catch (e) {
        throw { email: e.email || 'Your email or password is incorrect.' };
    }
};

export default authSlice.reducer;
