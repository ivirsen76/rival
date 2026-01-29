import classnames from 'classnames';
import useAppearance from '@/utils/useAppearance';
import { Squircle } from 'corner-smoothing';
import style from './style.module.scss';

type TitleProps = {
    colorHue: number;
    colorLightness: number;
    className?: string;
    children: React.ReactNode;
};

export const Title = (props: TitleProps) => {
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

Title.defaultProps = {
    colorHue: 202,
    colorLightness: 40,
};

type StatBoxProps = {
    text: React.ReactNode;
    label: React.ReactNode;
    image: React.ReactNode;
    colorHue: number;
    colorLightness: number;
    even: boolean;
    className: string;
    isLight: boolean;
    children: React.ReactNode;
};

const StatBox = (props: StatBoxProps) => {
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

StatBox.defaultProps = {
    colorHue: 202,
    colorLightness: 40,
};

export default StatBox;
