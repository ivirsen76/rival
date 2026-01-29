import style from './style.module.scss';

const marks = [
    ['2.50', '10%'],
    ['3.00', '26%'],
    ['3.50', '42%'],
    ['4.00', '58%'],
    ['4.50', '74%'],
    ['5.00', '90%'],
];

const Elo = (props) => {
    return (
        <div className={style.wrapper}>
            <div className="fw-bold">TLR</div>
            <div className={style.graph}>
                <div className={style.top}>
                    <div className={style.level} style={{ left: '26%' }}>
                        Men&apos;s 3.5
                    </div>
                    <div className={style.level} style={{ left: '58%' }}>
                        Men&apos;s 4.5
                    </div>
                </div>
                <div className={style.elo}>
                    {marks.map((item, index) => (
                        <div key={index} className={style.mark} style={{ left: item[1] }}>
                            {item[0]}
                        </div>
                    ))}
                    {marks.map((item, index) => (
                        <div key={index} className={style.stick} style={{ left: item[1] }} />
                    ))}
                </div>
                <div className={style.bottom}>
                    <div className={style.level} style={{ left: '10%' }}>
                        Men&apos;s 3.0
                    </div>
                    <div className={style.level} style={{ left: '42%' }}>
                        Men&apos;s 4.0
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Elo;
