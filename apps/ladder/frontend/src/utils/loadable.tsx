import originLoadable from '@loadable/component';
import Loader from '@/components/Loader';

export default (func, params = {}) =>
    originLoadable(func, {
        fallback: <Loader loading />,
        ...params,
    });
