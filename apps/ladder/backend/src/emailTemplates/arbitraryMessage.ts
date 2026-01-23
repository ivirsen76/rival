import type { Config } from '../types';
import { normal } from './normal';

export default (config: Config, { message }: { message: string }) =>
    normal(`<mj-text padding-top="0px" padding-bottom="0px">${message}</mj-text>`, { config });
