import { useRef, useEffect } from 'react';
import _omit from 'lodash/omit';
import useAppearance from '@/utils/useAppearance';

type EloPreviewProps = {
    data?: unknown[];
    width?: number;
    height?: number;
};

const EloPreview = (props: EloPreviewProps) => {
    const { height, width, data } = props;
    const padding = 4;
    const minGap = 30;
    const canvasRef = useRef(null);
    const appearance = useAppearance();

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // calculate largest piece of data
        let min = Infinity;
        let max = -Infinity;
        for (const value of data) {
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
        const gap = Math.max(max - min, minGap);
        const extraPadding = ((gap - max + min) / gap / 2) * (height - 2 * padding);

        context.beginPath();
        context.lineJoin = 'round';
        context.strokeStyle = appearance === 'dark' ? '#c2cbd6' : '#3f4254';
        for (let i = 0; i < data.length; i++) {
            const x = padding + ((width - 2 * padding) / (data.length - 1)) * i;
            const y = height - ((data[i] - min) / gap) * (height - 2 * padding) - padding - extraPadding;
            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        context.stroke();
    }, [appearance]);

    return <canvas ref={canvasRef} {..._omit(props, ['data'])} />;
};

EloPreview.defaultProps = {
    width: 400,
    height: 200,
};

export default EloPreview;
