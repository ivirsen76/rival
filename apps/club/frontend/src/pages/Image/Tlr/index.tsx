import { Title } from '@rival/common/components/Statbox';
import style from './style.module.scss';

const TlrImage = (props) => {
    const searchParams = new URLSearchParams(window.location.search);
    const elo = searchParams.get('elo');

    return (
        <div id="tl-image-wrapper" className={style.wrapper}>
            <Title colorHue={295}>{elo}</Title>
        </div>
    );
};

export default TlrImage;
