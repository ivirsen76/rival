import { useMemo } from 'react';
import dayjs from '@/utils/dayjs';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import Tooltip from '@rival/packages/components/Tooltip';
import QuestionIcon from '@rival/packages/metronic/icons/duotone/Navigation/Question.svg?react';
import { List } from './PlayersByPoints';
import { useSelector, useDispatch } from 'react-redux';
import { setShowAllPlayers } from '@/reducers/auth';
import ArrowDownIcon from '@rival/packages/metronic/icons/duotone/Navigation/Angle-down.svg?react';
import useBreakpoints from '@rival/packages/utils/useBreakpoints';

const firstPlayers = 10;
const tooManyPlayers = 20;

type PlayersLiveProps = {
    tournament: object;
    showDoublesPlayers: boolean;
};

const PlayersLive = (props: PlayersLiveProps) => {
    const { tournament, showDoublesPlayers } = props;
    const showAllPlayersForTournaments = useSelector((state) => state.auth.ui.showAllPlayersForTournaments);
    const size = useBreakpoints();
    const dispatch = useDispatch();

    const currentWeek = Math.ceil(dayjs.tz().diff(dayjs.tz(tournament.startDate), 'week', true));
    const showRankChanges = currentWeek > 1;
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const sortedPlayers = useMemo(
        () =>
            Object.values(tournament.players)
                .filter((player) => !player.hidden)
                .sort(
                    compareFields(
                        'stats.live.rank',
                        'stats.live.matches-desc',
                        'stats.live.matchesWon-desc',
                        'firstName',
                        'lastName'
                    )
                )
                .sort((a, b) => {
                    if (!a.partners || !b.partners) {
                        return 0;
                    }
                    if (a.partners.length > 1 && b.partners.length > 1) {
                        return 0;
                    }
                    return a.partners.length <= 1 ? 1 : -1;
                }),

        [tournament.players]
    );

    const totalPlayers = isDoublesTeam
        ? sortedPlayers.filter((item) => item.partners.length > 1).length
        : sortedPlayers.length;
    const isLarge = ['xl', 'xxl', 'lg'].includes(size);
    const showAllPlayers =
        showAllPlayersForTournaments.includes(tournament.id) || isLarge || totalPlayers <= tooManyPlayers;
    const visiblePlayers = showAllPlayers ? sortedPlayers : sortedPlayers.slice(0, firstPlayers);

    const list = visiblePlayers.map((player) => ({
        ...player,
        ...player.stats.live,
    }));

    const lastFinalPlayer = visiblePlayers
        .filter((player) => player.readyForFinal === 1)
        .slice(tournament.totalFinalPlayers - 1);
    const lineAfterId = lastFinalPlayer.length > 0 ? lastFinalPlayer[0].id : 0;
    const lineLabel = (
        <span>
            Top {tournament.totalFinalPlayers} Tournament Line
            <Tooltip
                content={
                    <div className="text-center">
                        The Top {tournament.totalFinalPlayers} players registered for the tournament above this line
                        will be participating in the Final Tournament.
                    </div>
                }
            >
                <span className="svg-icon svg-icon-dark ms-2">
                    <QuestionIcon />
                </span>
            </Tooltip>
        </span>
    );

    return (
        <>
            <List
                list={list}
                showDoublesPlayers={showDoublesPlayers}
                showRankChanges={showRankChanges}
                tournament={tournament}
                lineLabel={lineLabel}
                lineAfterId={lineAfterId}
            />
            {!showAllPlayers && (
                <div className="mt-4">
                    <a
                        href=""
                        onClick={(e) => {
                            e.preventDefault();
                            dispatch(setShowAllPlayers(tournament.id));
                        }}
                    >
                        <span className="svg-icon svg-icon-2 svg-icon-primary me-2">
                            <ArrowDownIcon />
                        </span>
                        Show all {totalPlayers} {isDoublesTeam ? 'teams' : 'players'}
                    </a>
                </div>
            )}
        </>
    );
};

export default PlayersLive;
