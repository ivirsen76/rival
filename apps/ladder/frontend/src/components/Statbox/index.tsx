import PropTypes from 'prop-types';
import classnames from 'classnames';
import useAppearance from '@/utils/useAppearance';
import { Squircle } from 'corner-smoothing';
import style from './style.module.scss';

export const Title = (props) => {
    const { colorHue, colorLightness, children, className } = props;
    const appearance = useAppearance();

    const lightnessBonus = appearance === 'dark' ? 10 : 0;

    return (
        <div
            className={classnames(style.text, className)}
            style={{
                backgroundImage: `linear-gradient(60deg, hsl(${colorHue - 15}, 80%, ${
                    colorLightness + lightnessBonus
                }%), hsl(${colorHue + 15}, 80%, ${colorLightness + 10 + lightnessBonus}%))`,
            }}
        >
            {children}
        </div>
    );
};

Title.propTypes = {
    colorHue: PropTypes.number,
    colorLightness: PropTypes.number,
    className: PropTypes.string,
    children: PropTypes.node,
};

Title.defaultProps = {
    colorHue: 202,
    colorLightness: 40,
};

const StatBox = (props) => {
    const { text, label, image, colorHue, colorLightness, even, className, isLight, children } = props;

    return (
        <Squircle
            cornerRadius={15}
            className={classnames(style.wrapper, { [style.light]: isLight, [style.even]: even }, className)}
        >
            {(text || text === 0) && (
                <Title colorHue={colorHue} colorLightness={colorLightness}>
                    {text}
                </Title>
            )}
            {label && <div className={style.label}>{label}</div>}
            {image && <div className={style.image}>{image}</div>}
            {children}
        </Squircle>
    );
};

StatBox.propTypes = {
    text: PropTypes.node,
    label: PropTypes.node,
    image: PropTypes.node,
    colorHue: PropTypes.number,
    colorLightness: PropTypes.number,
    even: PropTypes.bool,
    className: PropTypes.string,
    isLight: PropTypes.bool,
    children: PropTypes.node,
};

StatBox.defaultProps = {
    colorHue: 202,
    colorLightness: 40,
};

export default StatBox;
