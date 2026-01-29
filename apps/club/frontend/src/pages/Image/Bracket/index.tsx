import { useQuery } from 'react-query';
import axios from '@/utils/axios';
import style from './style.module.scss';
import { BYE_ID } from '@rival/club.backend/src/constants';
import classnames from 'classnames';
import Spot from './Spot';
import Bracket from './Bracket';
import { relationsUp } from '@rival/club.backend/src/services/matches/relations';

const BracketImage = (props) => {
    const searchParams = new URLSearchParams(window.location.search);
    const tournamentId = searchParams.get('tournamentId');

    const { data, isLoading } = useQuery('getFinalMatches', async () => {
        const response = await axios.put(`/api/tournaments/${tournamentId}`, { action: 'getFinalMatches' });
        return response.data;
    });

    if (isLoading) {
        return null;
    }

    const { matches, players } = data;
    const matchesObject = matches.reduce((obj, item) => {
        obj[item.finalSpot] = item;
        return obj;
    }, {});

    const renderMatch = (finalSpot) => {
        let match = matchesObject[finalSpot];
        const relation = relationsUp[finalSpot];
        const relatedMatch = matchesObject[relation?.finalSpot];

        if (!match && relatedMatch) {
            match = {
                finalSpot,
                challengerId: relatedMatch.challengerId || BYE_ID,
                acceptorId: relatedMatch.acceptorId || BYE_ID,
                challengerSeed: relatedMatch.challengerSeed,
                acceptorSeed: relatedMatch.acceptorSeed,
            };
        }
        if (!match) {
            match = { finalSpot };
        }

        let challenger;
        let acceptor;
        challenger = match.challengerId === BYE_ID ? { id: BYE_ID } : players[match.challengerId];
        acceptor = match.acceptorId === BYE_ID ? { id: BYE_ID } : players[match.acceptorId];

        if (!challenger) {
            challenger = { id: 0 };
        }
        if (!acceptor) {
            acceptor = { id: 0 };
        }

        return <Spot match={match} challenger={challenger} acceptor={acceptor} />;
    };

    const hasRound16 =
        matchesObject[15] ||
        matchesObject[14] ||
        matchesObject[13] ||
        matchesObject[12] ||
        matchesObject[11] ||
        matchesObject[10] ||
        matchesObject[9] ||
        matchesObject[8];
    const hasQuarterfinals = hasRound16 || matchesObject[7] || matchesObject[6] || matchesObject[5] || matchesObject[4];
    const hasSemifinals = hasQuarterfinals || matchesObject[3] || matchesObject[2];

    const totalLevels = hasRound16 ? 'four' : hasQuarterfinals ? 'three' : hasSemifinals ? 'two' : 'one';
    const columnsTotal = hasRound16 ? 4 : hasQuarterfinals ? 3 : hasSemifinals ? 2 : 1;

    return (
        <div id="tl-image-wrapper" className={style.wrapper} style={{ width: `${columnsTotal * 20}rem` }}>
            <div className={classnames(style.bracketWrapper, style[totalLevels])} data-final-bet-matches>
                {hasRound16 && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Round of 16</div>
                            {renderMatch(15)}
                            {renderMatch(14)}
                            {renderMatch(13)}
                            {renderMatch(12)}
                            {renderMatch(11)}
                            {renderMatch(10)}
                            {renderMatch(9)}
                            {renderMatch(8)}
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={15} bottomFinalSpot={14} middleFinalSpot={7} />
                            <Bracket topFinalSpot={13} bottomFinalSpot={12} middleFinalSpot={6} />
                            <Bracket topFinalSpot={11} bottomFinalSpot={10} middleFinalSpot={5} />
                            <Bracket topFinalSpot={9} bottomFinalSpot={8} middleFinalSpot={4} />
                        </div>
                    </>
                )}
                {hasQuarterfinals && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Quarterfinals</div>
                            <div className={hasRound16 ? style.margin7 : ''}>{renderMatch(7)}</div>
                            <div className={hasRound16 ? style.margin6 : ''}>{renderMatch(6)}</div>
                            <div className={hasRound16 ? style.margin5 : ''}>{renderMatch(5)}</div>
                            <div className={hasRound16 ? style.margin4 : ''}>{renderMatch(4)}</div>
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={7} bottomFinalSpot={6} middleFinalSpot={3} />
                            <Bracket topFinalSpot={5} bottomFinalSpot={4} middleFinalSpot={2} />
                        </div>
                    </>
                )}
                {hasSemifinals && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Semifinals</div>
                            <div className={hasQuarterfinals ? style.margin3 : ''}>{renderMatch(3)}</div>
                            <div className={hasQuarterfinals ? style.margin2 : ''}>{renderMatch(2)}</div>
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={3} bottomFinalSpot={2} middleFinalSpot={1} />
                        </div>
                    </>
                )}
                <div className={style.matches}>
                    <div className={'fw-bold text-muted ' + style.header}>Final</div>
                    <div className={style.margin1}>{renderMatch(1)}</div>
                </div>
            </div>
        </div>
    );
};

export default BracketImage;
