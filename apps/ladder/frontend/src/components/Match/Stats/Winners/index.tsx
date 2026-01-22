import classnames from 'classnames';
import style from './style.module.scss';

type BarProps = {
    label: string;
    num: number;
    total: number;
    isBetter: boolean;
};

const Bar = (props: BarProps) => {
    const { label, num, total, isBetter } = props;

    return (
        <div className={style.barWrapper}>
            <div className={classnames(style.num, { [style.better]: isBetter })}>{num}</div>
            <div className={style.bar}>
                <div
                    className={classnames(style.line, { [style.better]: isBetter })}
                    style={{ width: `${(num / total) * 100}%` }}
                />
            </div>
            <div className={style.label}>{label}</div>
        </div>
    );
};

type WinnersProps = {
    title: string;
    data: unknown[];
    isGrowing: boolean;
};

const Winners = (props: WinnersProps) => {
    const { title, data, isGrowing } = props;

    const totals = data.reduce(
        (res, item) => {
            res[0] += item.nums[0];
            res[1] += item.nums[1];
            return res;
        },
        [0, 0]
    );

    return (
        <div className={style.wrapper}>
            <div className={style.title}>{title}</div>
            <div>
                {[0, 1].map((index) => {
                    const isBetter = isGrowing ? totals[index] > totals[1 - index] : totals[index] < totals[1 - index];

                    return (
                        <div className={style.block} key={index}>
                            <div className={classnames(style.total, { [style.better]: isBetter })}>{totals[index]}</div>
                            <div className={style.parts}>
                                {data.map((item) => (
                                    <Bar
                                        key={item.label}
                                        label={item.label}
                                        num={item.nums[index]}
                                        total={totals[index]}
                                        isBetter={
                                            isGrowing
                                                ? item.nums[index] > item.nums[1 - index]
                                                : item.nums[index] < item.nums[1 - index]
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

Winners.defaultProps = {
    isGrowing: true,
};

export default Winners;
