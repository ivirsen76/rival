import PropTypes from 'prop-types';
import Result from './Result';
import HiddenText from '@/components/HiddenText';
import TournamentText from '@/components/TournamentText';
import classnames from 'classnames';
import { getDoublesTournamentText } from '@/pages/Tournament/texts';
import Bracket from '../Final/Bracket';
import { BYE_ID } from '@rival/ladder.backend/src/constants';
import style from './style.module.scss';

const DoublesFinal = props => {
    const { players, tournament, reloadTournament, showTournamentText, isReport } = props;
    const matches = props.matches.reduce((obj, match) => {
        obj[match.finalSpot] = match;
        return obj;
    }, {});
    const totalPlayers = props.matches.reduce((list, match) => {
        if (match.player1Id) {
            list.add(match.player1Id);
        }
        if (match.player2Id) {
            list.add(match.player2Id);
        }
        if (match.player3Id) {
            list.add(match.player3Id);
        }
        if (match.player4Id) {
            list.add(match.player4Id);
        }

        return list;
    }, new Set()).size;

    const renderMatch = finalSpot => {
        const relationsUp = {
            3: { finalSpot: 1 },
            2: { finalSpot: 1 },
        };

        let match = matches[finalSpot];
        const matchPlayers = {
            1: null,
            2: null,
            3: null,
            4: null,
        };

        let winnerCount = 2;
        if (match) {
            for (const i of [1, 2, 3, 4]) {
                matchPlayers[i] = players[match[`player${i}Id`]];
            }
        }
        if (!match && relationsUp[finalSpot]) {
            const relation = relationsUp[finalSpot];
            const relatedMatch = matches[relation.finalSpot];
            if (relatedMatch) {
                match = {};
                for (let i = 1; i <= totalPlayers - 4; i++) {
                    match[`player${i}Id`] = relatedMatch[`player${i}Id`];
                    match[`player${i}Seed`] = relatedMatch[`player${i}Seed`];
                    matchPlayers[i] = players[relatedMatch[`player${i}Id`]];
                }
                for (let i = 4; i > totalPlayers - 4; i--) {
                    matchPlayers[i] = { id: BYE_ID };
                }
            }
        }
        if (match && relationsUp[finalSpot]) {
            const relation = relationsUp[finalSpot];
            const relatedMatch = matches[relation.finalSpot];
            if (relatedMatch) {
                const currentPlayerIds = [1, 2, 3, 4].map(i => match[`player${i}Id`]).filter(Boolean);
                winnerCount = [1, 2, 3, 4].filter(
                    i => !relatedMatch[`player${i}Id`] || currentPlayerIds.includes(relatedMatch[`player${i}Id`])
                ).length;

                if (winnerCount === 4) {
                    winnerCount = 2;
                }
            }
        }

        const readOnly = (() => {
            if (!match) {
                return false;
            }

            const relation = relationsUp[finalSpot];
            if (!relation) {
                return false;
            }

            const nextMatch = matches[relation.finalSpot];
            if (!nextMatch) {
                return false;
            }

            return Boolean(nextMatch.score1);
        })();

        if (!match) {
            match = { id: 0 };
        }
        [1, 2, 3, 4].forEach(i => {
            if (!matchPlayers[i]) {
                matchPlayers[i] = { id: 0 };
            }
        });

        return (
            <Result
                player1={matchPlayers[1]}
                player2={matchPlayers[2]}
                player3={matchPlayers[3]}
                player4={matchPlayers[4]}
                players={players}
                winnerCount={winnerCount}
                match={match}
                reloadTournament={reloadTournament}
                finalSpot={finalSpot}
                readOnly={readOnly}
            />
        );
    };

    if (props.matches.length === 0) {
        return null;
    }

    const hasSemifinals = Boolean(matches[3] || matches[2]);
    const totalLevels = hasSemifinals ? 'two' : 'one';

    const tournamentText = getDoublesTournamentText();
    const tournamentRules =
        showTournamentText && tournamentText ? (
            <HiddenText title="Tournament information" className="mb-4">
                <TournamentText text={tournamentText} tournament={tournament} />
            </HiddenText>
        ) : null;

    return (
        <div data-final-tournament-area>
            {!isReport && <h3>Final Tournament</h3>}
            {!isReport && tournamentRules}
            <div
                className={classnames(style.wrapper, style[totalLevels], { [style.isReport]: isReport })}
                data-final-brackets
            >
                {hasSemifinals && (
                    <>
                        <div className={style.matches}>
                            <div className={'fw-bold text-muted ' + style.header}>Semifinals</div>
                            <div>{renderMatch(3)}</div>
                            <div>{renderMatch(2)}</div>
                        </div>
                        <div className={style.divider}>
                            <Bracket topFinalSpot={3} bottomFinalSpot={2} middleFinalSpot={1} />
                        </div>
                    </>
                )}
                <div>
                    <div className={'fw-bold text-muted ' + style.header}>Final</div>
                    <div className={style.margin7}>{renderMatch(1)}</div>
                </div>
            </div>
        </div>
    );
};

DoublesFinal.propTypes = {
    matches: PropTypes.array,
    players: PropTypes.object,
    tournament: PropTypes.object,
    reloadTournament: PropTypes.func,
    showTournamentText: PropTypes.bool,
    isReport: PropTypes.bool,
};

export default DoublesFinal;
