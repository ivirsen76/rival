import * as React from 'react';
import Blank from './Blank';
import Kurt from './Kurt';
import Prescription01 from './Prescription01';
import Prescription02 from './Prescription02';
import Round from './Round';
import Sunglasses from './Sunglasses';
import Wayfarers from './Wayfarers';
import CustomGlasses1 from './CustomGlasses1';
import CustomGlasses2 from './CustomGlasses2';
import CustomGlasses3 from './CustomGlasses3';
import CustomGlasses4 from './CustomGlasses4';
import { AccessoriesOption, Selector } from '../../../options';

export default class Accessories extends React.Component {
    render() {
        return (
            <Selector defaultOption={Blank} option={AccessoriesOption}>
                <Blank />
                <Kurt />
                <Prescription01 />
                <Prescription02 />
                <Round />
                <Sunglasses />
                <Wayfarers />
                <CustomGlasses1 />
                <CustomGlasses2 />
                <CustomGlasses3 />
                <CustomGlasses4 />
            </Selector>
        );
    }
}
