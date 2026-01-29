import _round from 'lodash/round';

type LastMatchesEloProps = {
    data: unknown[];
};

const LastMatchesElo = (props: LastMatchesEloProps) => {
    const { data } = props;
    const padding = 20;
    const step = 11;
    const width = 4;
    const TITLE_HEIGHT = 40;
    const MIN_DIFF = 100;

    const path = (() => {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const diff = max - min;
        const scale = Math.min(1, MIN_DIFF / diff);
        const addition = Math.max(0, (MIN_DIFF - diff) / 2);
        const adjustedStep = (step * 29) / (data.length - 1);

        return data
            .map((num, index) => {
                return `${index === 0 ? 'M' : 'L'} ${_round(index * adjustedStep, 2)} ${_round(
                    (max - num) * scale + addition + TITLE_HEIGHT,
                    2
                )}`;
            })
            .join(' ');
    })();

    return (
        <svg
            viewBox={`${-padding - width} ${-padding - width} ${step * 29 + width * 2 + padding * 2} ${
                MIN_DIFF + TITLE_HEIGHT + width * 2 + padding * 2
            }`}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
        >
            <line stroke="#ccc" x1="-1" y1="50" x2="320" y2="50" />
            <line stroke="#ccc" x1="-1" y1="90" x2="320" y2="90" />
            <line stroke="#ccc" x1="-1" y1="130" x2="320" y2="130" />

            <path d={path} fill="none" stroke="#6db7d9" strokeWidth={`${width}px`} strokeLinecap="round" />
        </svg>
    );
};

export default LastMatchesElo;
