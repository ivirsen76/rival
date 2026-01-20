import { useRef } from 'react';

export default (score) => {
    const prevScore = useRef(score);

    if (!prevScore.current && score) {
        prevScore.current = score;
        return true;
    }

    return false;
};
