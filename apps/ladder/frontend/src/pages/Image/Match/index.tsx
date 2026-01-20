import Match from '@/components/Match';
import _omit from 'lodash/omit';
import style from './style.module.scss';

const MatchImage = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const matchProps = JSON.parse(searchParams.get('props'));

    const { players } = matchProps;

    // populate partners if partnerIds is present
    for (const player of Object.values(players)) {
        if (player.partnerIds) {
            player.partners = player.partnerIds.map(playerId => _omit(players[playerId], ['partnerIds', 'partners']));
        }
    }

    return (
        <div className={style.wrapper}>
            <div id="tl-image-wrapper" style={{ width: 315 }}>
                <Match {...matchProps} tournament={{ players }} showInfo={false} />
            </div>
        </div>
    );
};

export default MatchImage;
