import 'bootstrap';
import { createRoot } from 'react-dom/client';
import './index.scss';
import App from './App';
import store from './app/store';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import axios from '@rival/common/axios';

axios.defaults.baseURL = window.TL_SERVER_URL || import.meta.env.VITE_SERVER_URL || '';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: async ({ queryKey }) => {
                const response = await axios.get(queryKey[0]);
                return response.data.data;
            },
            retry: 0,
            staleTime: 10 * 60 * 1000,
        },
    },
});

window.tl = window.tl || {};
window.tl.queryClient = queryClient;
window.tl.store = store;

const root = createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </Provider>
);
