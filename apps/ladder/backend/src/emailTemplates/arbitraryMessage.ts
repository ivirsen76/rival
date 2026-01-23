import type { Config } from '../types';
import { normal } from './normal';

type Params = {
    config: Config;
    message: string;
};

export default ({ config, message }: Params) =>
    normal(`<mj-text padding-top="0px" padding-bottom="0px">${message}</mj-text>`, { config });
