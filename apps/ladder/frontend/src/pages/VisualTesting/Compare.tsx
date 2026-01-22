import { useState, useEffect } from 'react';
import classnames from 'classnames';
import axios from '@/utils/axios';
import style from './style.module.scss';

const types = [
    { value: 'base', label: 'Base', key: '1' },
    { value: 'actual', label: 'Actual', key: '2' },
    { value: 'diff', label: 'Diff', key: '3' },
];

type CompareProps = {
    file: string;
    percent: number;
    size: object;
    onAccept: (...args: unknown[]) => unknown;
};

const Compare = (props: CompareProps) => {
    const { file, percent, size, onAccept } = props;
    const [type, setType] = useState('diff');

    const src = `/screenshots/${type}/${file}`;

    useEffect(() => {
        const onKeyDown = (event) => {
            const foundType = types.find((item) => item.key === event.key);
            if (foundType) {
                setType(foundType.value);
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    const acceptChanges = async () => {
        await axios.put(`/api/utils/0`, { action: 'acceptVisualChanges', file });
        onAccept();
    };

    return (
        <div className={style.info}>
            <div className="d-flex justify-content-between align-items-start mb-6">
                <div className={style.buttons}>
                    {types.map((item) => (
                        <button
                            key={item.value}
                            className={classnames('btn', type === item.value ? 'btn-primary' : 'btn-secondary')}
                            type="button"
                            onClick={() => setType(item.value)}
                        >
                            {item.key}. {item.label}
                        </button>
                    ))}
                </div>
                <button type="button" className="btn btn-success" onClick={acceptChanges}>
                    Accept changes
                </button>
            </div>
            {percent === 999 && type === 'diff' ? (
                'Size is different'
            ) : (
                <img src={src} alt={file} style={{ width: `${size.width / 2}px` }} />
            )}
        </div>
    );
};

Compare.defaultProps = {};

export default Compare;
