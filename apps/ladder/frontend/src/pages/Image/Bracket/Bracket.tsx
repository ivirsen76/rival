import { useState, useEffect } from 'react';
import style from './style.module.scss';

type BracketProps = {
    topFinalSpot?: number;
    bottomFinalSpot?: number;
    middleFinalSpot?: number;
};

const Bracket = (props: BracketProps) => {
    const [top, setTop] = useState('-9999px');
    const [middle, setMiddle] = useState('-9999px');
    const [height, setHeight] = useState('0px');
    const { topFinalSpot, middleFinalSpot, bottomFinalSpot } = props;

    useEffect(() => {
        const bracketElement = document.querySelector('[data-final-bet-matches]');
        const topElement = document.querySelector(`[data-bet-match-middle="${topFinalSpot}"]`);
        const middleElement = document.querySelector(`[data-bet-match-middle="${middleFinalSpot}"]`);
        const bottomElement = document.querySelector(`[data-bet-match-middle="${bottomFinalSpot}"]`);

        if (!bracketElement || !topElement || !middleElement || !bottomElement) {
            return;
        }

        const bracketRect = bracketElement.getBoundingClientRect();
        const topRect = topElement.getBoundingClientRect();
        const middleRect = middleElement.getBoundingClientRect();
        const bottomRect = bottomElement.getBoundingClientRect();

        setTop(`${topRect.top - bracketRect.top - 1}px`);
        setMiddle(`${middleRect.top - topRect.top - 1}px`);
        setHeight(`${bottomRect.top - topRect.top + 2}px`);
    });

    return (
        <div className={style.bracket} style={{ top, height }}>
            <div className={style.tick} style={{ top: middle }} />
        </div>
    );
};

export default Bracket;
