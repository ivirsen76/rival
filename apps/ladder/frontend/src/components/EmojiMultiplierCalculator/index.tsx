import { useEffect, useRef } from 'react';
import style from './style.module.scss';

const EmojiMultiplierCalculator = props => {
    const emojiRef = useRef();
    const textRef = useRef();

    useEffect(() => {
        if (!emojiRef.current || !textRef.current) {
            return;
        }

        const getNodeWidth = node => {
            const { width } = node.getBoundingClientRect();
            return width;
        };

        const calculate = () => {
            const emojiWidth = getNodeWidth(emojiRef.current);
            const textWidth = getNodeWidth(textRef.current);

            const actualMultiplier = emojiWidth / textWidth;
            const desiredMultiplier = 1.32;

            const multiplier = desiredMultiplier / actualMultiplier;
            const margin = `${(multiplier - 1) / 2}em`;

            const root = document.querySelector(':root');
            if (root) {
                root.style.setProperty('--custom-emoji-scale', multiplier);
                root.style.setProperty('--custom-emoji-margin', margin);
            }
        };

        calculate();

        // calculate again after 10 seconds
        // fonts could be available after a while
        const timeout = setTimeout(calculate, 10 * 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className={style.wrapper}>
            <span ref={emojiRef}>{'😀'.repeat(10)}</span>
            <span ref={textRef}>{'m'.repeat(10)}</span>
        </div>
    );
};

export default EmojiMultiplierCalculator;
