import { useMemo } from 'react';
import Table from '@rival/common/components/Table';
import PlayerAvatar from '@rival/common/components/PlayerAvatar';
import PlayerName from '@rival/common/components/PlayerName';
import Modal from '@rival/common/components/Modal';
import BetResult from '../BetResult';
import BracketsIcon from '@/assets/brackets.svg?react';
import BotIcon from '@/assets/bot.svg?react';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import { BRACKET_BOT_ID } from '@rival/ladder.backend/src/constants';
import style from './style.module.scss';

type BetContestProps = {
    tournament: object;
    players: object;
    matches: object;
};

const BetContest = (props: BetContestProps) => {
    const { tournament, players, matches } = props;
    const size = useBreakpoints();
    const isSmall = ['xs'].includes(size);

    const data = useMemo(() => {
        const result = Object.values(players).filter((item) => item.prediction);

        if (tournament.botPrediction) {
            result.push({
                id: BRACKET_BOT_ID,
                firstName: 'BracketBot',
                lastName: '',
                stats: { rank: 0 },
                prediction: tournament.botPrediction,
                predictionPoints: tournament.botPredictionPoints,
            });
        }

        let counter = 1;
        result
            .sort(compareFields('predictionPoints.points-desc', 'predictionPoints.maxPoints-desc', 'stats.rank'))
            .forEach((item, index) => {
                item.rank = counter++;
            });

        return result;
    }, [tournament, players]);

    const columns = [
        {
            name: 'rank',
            label: '#',
        },
        {
            name: 'name',
            label: 'Player',
            className: 'ps-0',
            render: (value, row) => (
                <div className="d-flex align-items-center gap-2">
                    {row.id === BRACKET_BOT_ID ? (
                        <span className={style.botIcon}>
                            <BotIcon />
                        </span>
                    ) : (
                        <PlayerAvatar player1={row} />
                    )}
                    <PlayerName player1={row} />
                </div>
            ),
        },
        {
            name: 'points',
            label: 'Points',
            className: 'text-center',
            render: (value, row) => row.predictionPoints.points,
        },
        ...(tournament.predictionWinner
            ? []
            : [
                  {
                      name: 'maxPoints',
                      label: isSmall ? 'Max' : 'Max points',
                      className: 'text-center',
                      render: (value, row) => row.predictionPoints.maxPoints,
                  },
              ]),
        {
            name: 'prediction',
            label: isSmall ? '' : 'Bracket',
            className: 'text-center',
            render: (value, row) => {
                const fullName = `${row.firstName} ${row.lastName}`.trim();

                return (
                    <Modal
                        title={`${fullName}'s Bracket`}
                        hasForm={false}
                        size="xl"
                        renderTrigger={({ show }) => (
                            <button
                                type="button"
                                className="btn btn-secondary btn-xs btn-icon"
                                title="Show bracket"
                                onClick={show}
                                data-bracket-result={row.id}
                            >
                                <span className="svg-icon svg-icon-3">
                                    <BracketsIcon />
                                </span>
                            </button>
                        )}
                        renderBody={({ hide }) => (
                            <BetResult
                                players={players}
                                prediction={row.prediction}
                                predictionPoints={row.predictionPoints}
                                matches={matches}
                                showMaxPoints={!tournament.predictionWinner}
                            />
                        )}
                    />
                );
            },
        },
    ];

    return <Table columns={columns} data={data} showRowNumber={false} />;
};

export default BetContest;
