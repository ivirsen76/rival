import loadable from '../../utils/loadable';

// Just to preload lazy bundles
const Chart = loadable(() => import('./lazy'), { fallback: null });

export default (props) => <Chart {...props} />;
