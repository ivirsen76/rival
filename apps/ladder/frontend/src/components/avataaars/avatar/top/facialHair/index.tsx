import * as React from 'react';
import BeardLight from './BeardLight';
import BeardMajestic from './BeardMajestic';
import BeardMedium from './BeardMedium';
import Blank from './Blank';
import MoustacheFancy from './MoustacheFancy';
import MoustacheMagnum from './MoustacheMagnum';
import CustomMoustache1 from './CustomMoustache1';
import CustomMoustache2 from './CustomMoustache2';
import CustomMoustache3 from './CustomMoustache3';
import CustomMoustache4 from './CustomMoustache4';
import CustomMoustache5 from './CustomMoustache5';
import CustomMoustache6 from './CustomMoustache6';
import { FacialHairOption, Selector } from '../../../options';

export default class FacialHair extends React.Component {
    render() {
        return (
            <Selector option={FacialHairOption} defaultOption={Blank}>
                <Blank />
                <BeardMedium />
                <BeardLight />
                <BeardMajestic />
                <MoustacheFancy />
                <MoustacheMagnum />
                <CustomMoustache1 />
                <CustomMoustache2 />
                <CustomMoustache3 />
                <CustomMoustache4 />
                <CustomMoustache5 />
                <CustomMoustache6 />
            </Selector>
        );
    }
}
