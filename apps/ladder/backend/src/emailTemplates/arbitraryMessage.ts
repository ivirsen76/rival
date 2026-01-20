import { normal } from './normal';

export default (config, { message }) =>
    normal(`<mj-text padding-top="0px" padding-bottom="0px">${message}</mj-text>`, { config });
