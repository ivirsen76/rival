import { Fragment } from 'react';
import PropTypes from 'prop-types';

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

const Arc = (props) => {
    const { list, width } = props;

    const circleRadius = 100 - width * list.length + width / 2;

    return (
        <svg viewBox={`-${width / 2} -${width / 2} ${200 + width} ${200 + width}`} xmlns="http://www.w3.org/2000/svg">
            <circle style={{ fill: 'rgba(0, 0, 0, 0.3)' }} cx="100" cy="100" r={circleRadius} />

            {list.map((item, index) => {
                const { color } = item;
                const percent = item.percent === 100 ? 99.99 : item.percent;

                const xx = 0 + index * width;
                const yy = 100;
                const radius = 100 - index * width;

                const angle = (percent / 100) * 360 - 90;
                const { x, y } = polarToCartesian(100, 100, radius, angle);
                const largeArcFlag = percent > 50 ? 1 : 0;
                const sweepFlag = percent > 50 ? 1 : 0;

                return (
                    <Fragment key={index}>
                        <path
                            style={{
                                stroke: 'rgba(255, 255, 255, 0.1)',
                                fill: 'none',
                                strokeWidth: `${width}px`,
                            }}
                            d={`M ${xx} ${yy} A ${radius} ${radius} 1 1 1 ${xx} ${yy + 0.001}`}
                        />
                        <path
                            style={{
                                stroke: color,
                                fill: 'none',
                                strokeWidth: `${width}px`,
                                strokeLinecap: 'round',
                            }}
                            d={`M ${xx} ${yy} A ${radius} ${radius} ${largeArcFlag} ${sweepFlag} 1 ${x} ${y}`}
                        />
                    </Fragment>
                );
            })}
        </svg>
    );
};

Arc.propTypes = {
    width: PropTypes.number,
    list: PropTypes.array,
};

Arc.defaultProps = {
    width: 10,
    list: [],
};

export default Arc;
