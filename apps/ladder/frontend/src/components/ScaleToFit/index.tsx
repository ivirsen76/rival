import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import style from './style.module.scss';

const ScaleToFit = (props) => {
    const [scale, setScale] = useState(0);
    const [height, setHeight] = useState(0);
    const wrapperRef = useRef();
    const childRef = useRef();

    useEffect(() => {
        const newScale = Math.min(wrapperRef.current.clientWidth / props.width, 1);
        setScale(newScale);

        if (childRef.current) {
            const newHeight = childRef.current.clientHeight * newScale;
            setHeight(newHeight);
        }
    }, []);

    return (
        <div ref={wrapperRef} className={style.wrapper} style={scale === 1 ? {} : { height: `${height}px` }}>
            {scale === 1 ? (
                props.children
            ) : (
                <div
                    ref={childRef}
                    style={{
                        width: `${props.width}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}
                >
                    {props.children}
                </div>
            )}
        </div>
    );
};

ScaleToFit.propTypes = {
    children: PropTypes.node,
    width: PropTypes.number,
};

export default ScaleToFit;
