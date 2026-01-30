import { useState, useEffect, useMemo } from 'react';
import Match from '@/components/Match';
import Card from '@rival/common/components/Card';
import Modal from '@rival/common/components/Modal';
import classnames from 'classnames';
import FormNewMatch from '@/components/FormNewMatch';
import FormNewDoublesMatch from '@/components/FormNewDoublesMatch';
import LazyLoad, { forceCheck } from 'react-lazyload';
import usePlayerFilter from '../usePlayerFilter';
import { useSelector } from 'react-redux';
import { getUpcomingMatches } from '../Overview';
import checkUserReady from '@/utils/checkUserReady';
import style from './style.module.scss';

type MatchesProps = {
    tournament: object;
    reloadTournament: (...args: unknown[]) => unknown;
};

const Matches = (props: MatchesProps) => {
    const { tournament, reloadTournament } = props;
    const { players } = tournament;
    const [matchFilter, setMatchFilter] = useState('played');
    const { selected, playerFilter } = usePlayerFilter({ players });
    const currentUser = useSelector((state) => state.auth.user);
    const isDoubles = tournament.levelType === 'doubles';
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const upcomingMatches = getUpcomingMatches({ tournament, currentUser });

    useEffect(() => {
        forceCheck();
    }, [selected, matchFilter]);

    const matches = useMemo(() => {
        return tournament.matches.filter(
            (match) =>
                match.type === 'regular' &&
                !match.unavailable &&
                match.acceptorId &&
                match.playedAt &&
                (matchFilter === 'played' ? match.score : !match.score) &&
                (selected.length === 0 ||
                    selected.some((playerId) =>
                        [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id].includes(
                            playerId
                        )
                    ))
        );
    }, [matchFilter, selected, tournament]);

    const isMyTournament = Boolean(
        currentUser &&
        currentUser.tournaments[tournament.id]?.isActive &&
        !currentUser.tournaments[tournament.id]?.needPartner &&
        !currentUser.tournaments[tournament.id]?.partnerId
    );
    const ActualFormNewMatch = isDoubles ? FormNewDoublesMatch : FormNewMatch;

    return (
        <div className={style.wrapper}>
            <div className={style.filter}>
                <Card>
                    <h3>Filter</h3>
                    <button
                        type="button"
                        className={classnames(
                            'btn btn-sm me-2',
                            matchFilter === 'played' ? 'btn-primary' : 'btn-light'
                        )}
                        onClick={() => setMatchFilter('played')}
                    >
                        Finished
                    </button>
                    <button
                        type="button"
                        className={classnames(
                            'btn btn-sm me-2',
                            matchFilter === 'notPlayed' ? 'btn-primary' : 'btn-light'
                        )}
                        onClick={() => setMatchFilter('notPlayed')}
                    >
                        Proposed
                    </button>
                    {playerFilter}
                </Card>
            </div>
            <div className={classnames(style.list, { [style.doubles]: isDoubles || isDoublesTeam })}>
                <Card className={style.matches}>
                    <div className="d-flex justify-content-between align-items-center mb-6">
                        <h3 className="m-0">
                            Matches
                            <span className="badge badge-secondary ms-2 align-middle">{matches.length}</span>
                        </h3>
                        {isMyTournament && !tournament.isOver && tournament.isStarted && (
                            <div>
                                <Modal
                                    title="Report match"
                                    hasForm={false}
                                    size="sm"
                                    renderTrigger={({ show }) => (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={checkUserReady(show)}
                                        >
                                            Report match
                                        </button>
                                    )}
                                    renderBody={({ hide }) => (
                                        <ActualFormNewMatch
                                            possibleMatches={upcomingMatches}
                                            tournament={tournament}
                                            onAdd={async () => {
                                                await reloadTournament();
                                                hide();
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {matches.length === 0 && <div>No matches found.</div>}
                    {matches.map((match) => (
                        <LazyLoad key={match.id} height={100} once>
                            <Match
                                match={match}
                                players={players}
                                onUpdate={reloadTournament}
                                tournament={tournament}
                            />
                        </LazyLoad>
                    ))}
                </Card>
            </div>
        </div>
    );
};

export default Matches;
