import { useState } from 'react';
import pieces from '../pieces';
import Avatar from '../../avataaars';
import style from '../PiecePicker/style.module.scss';

let counter = 0;

const generateRandom = (total = 12) => {
    const getRandomItem = (array) => {
        const len = array.reduce((sum, obj) => sum + (obj.weight || 1), 0);
        const num = Math.floor(Math.random() * len);
        let count = 0;
        for (const item of array) {
            count += item.weight || 1;
            if (num < count) {
                return item.value;
            }
        }

        return array[0].value;
    };

    return new Array(total).fill(0).map((_) => {
        const item = {};
        for (const [type, settings] of Object.entries(pieces)) {
            item[type] = getRandomItem(settings.options);
        }
        item.id = `${counter++}-${Number(Date.now())}`;
        return item;
    });
};

type PiecePickerProps = {
    setValues: (...args: unknown[]) => unknown;
};

const PiecePicker = (props: PiecePickerProps) => {
    const { setValues } = props;
    const [list, setList] = useState(() => generateRandom());

    return (
        <div>
            <div className="mb-6">
                <button type="button" className="btn btn-primary" onClick={() => setList(generateRandom())}>
                    Refresh
                </button>
            </div>
            <div className={style.wrapper}>
                {list.map((values, index) => (
                    <div
                        key={values.id}
                        className={style.image}
                        data-random-avatar={index + 1}
                        onClick={() => {
                            setValues(values);
                        }}
                    >
                        <Avatar style={{ width: '100%', height: 'auto' }} avatarStyle="Transparent" {...values} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PiecePicker;
