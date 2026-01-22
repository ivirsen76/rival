import { useState } from 'react';
import PlusIcon from '@/styles/metronic/icons/duotone/Interface/Plus-Square.svg?react';
import MinusIcon from '@/styles/metronic/icons/duotone/Interface/Minus-Square.svg?react';
import style from './style.module.scss';

type HiddenTextProps = {
    title: string;
    className: string;
    contentClassName: string;
    children: React.ReactNode;
    renderContent: (...args: unknown[]) => unknown;
};

const HiddenText = (props: HiddenTextProps) => {
    const [visible, setVisible] = useState(false);

    const toggleVisible = (e) => {
        e && e.preventDefault();
        setVisible(!visible);
    };

    const getContent = () => {
        return props.renderContent ? (
            props.renderContent()
        ) : (
            <div className={'alert alert-primary mb-0 mt-2 ' + style.content + ' ' + props.contentClassName}>
                {props.children}
            </div>
        );
    };

    return (
        <div className={props.className}>
            <a href="" className="d-inline-flex align-items-center" onClick={toggleVisible}>
                <span className={'svg-icon toggle-on svg-icon-primary svg-icon-3 ' + style.icon}>
                    {visible ? <MinusIcon /> : <PlusIcon />}
                </span>

                <div>{props.title}</div>
            </a>
            {visible && getContent()}
        </div>
    );
};

HiddenText.defaultProps = {
    className: '',
    contentClassName: '',
};

export default HiddenText;
