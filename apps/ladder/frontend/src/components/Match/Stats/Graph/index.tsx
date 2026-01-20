import PropTypes from 'prop-types';
import Arc from './Arc';
import { defaultColors } from '../config';
import style from './style.module.scss';

const Graph = (props) => {
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

Graph.propTypes = {
    list: PropTypes.array,
};

export default Graph;
