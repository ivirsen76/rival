import Arc from './Arc';
import { defaultColors } from '../config';
import style from './style.module.scss';

type GraphProps = {
    list: unknown[];
};

const Graph = (props: GraphProps) => {
    const list = props.list.map((item, index) => ({ color: defaultColors[index], ...item }));

    return (
        <div className={style.wrapper}>
            <div className={style.numbers}>
                {list.map((item, index) => (
                    <div key={index} style={{ color: item.color }}>
                        {item.percent}%
                    </div>
                ))}
            </div>
            <Arc list={list} />
        </div>
    );
};

export default Graph;
