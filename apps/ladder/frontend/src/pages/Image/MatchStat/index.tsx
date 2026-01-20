import Stats from '@/components/Match/Stats';
import style from './style.module.scss';

const MatchStat = (props) => {
    const searchParams = new URLSearchParams(window.location.search);
    const statProps = JSON.parse(searchParams.get('props'));

    return (
        <div className={style.wrapper}>
            <div id="tl-image-wrapper" style={{ width: 1098 }}>
                <Stats {...statProps} />
            </div>
        </div>
    );
};

export default MatchStat;
