import loadable from '../../utils/loadable';

// Just to preload lazy bundles
const Chart = loadable(() => import(/* webpackPrefetch: true */ './lazy.jsx'), { fallback: null });

export default (props) => <Chart {...props} />;
