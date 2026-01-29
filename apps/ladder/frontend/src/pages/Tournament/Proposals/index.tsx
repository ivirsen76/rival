import { useState, useEffect } from 'react';
import Card from '@rival/packages/components/Card';
import Proposal from '@/components/Proposal';
import ProposalDoubles from '@/components/ProposalDoubles';
import classnames from 'classnames';
import LazyLoad, { forceCheck } from 'react-lazyload';
import usePlayerFilter from '../usePlayerFilter';
import FormProposal from '@/components/FormProposal';
import FormDoublesProposal from '@/components/FormDoublesProposal';
import Modal from '@/components/Modal';
import dayjs from '@/utils/dayjs';
import { useSelector } from 'react-redux';
import checkUserReady from '@/utils/checkUserReady';
import useConfig from '@/utils/useConfig';
import style from './style.module.scss';

type ProposalsProps = {
    tournament: object;
    reloadTournament: (...args: unknown[]) => unknown;
};

const Proposals = (props: ProposalsProps) => {
    const { reloadTournament, tournament } = props;
    const { matches, players } = tournament;
    const [matchFilter, setMatchFilter] = useState('all');
    const { selected, playerFilter } = usePlayerFilter({ players });
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;
    const currentPlayer = players[currentPlayerId];

    const now = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');

    useEffect(() => {
        forceCheck();
    }, [selected, matchFilter]);

    const proposals = matches.filter((match) => {
        if (match.initial !== 1) {
            return false;
        }

        const playerIds = [match.challengerId, match.challenger2Id, match.acceptorId, match.acceptor2Id];
        if (selected.length > 0 && !playerIds.some((playerId) => selected.includes(playerId))) {
            return false;
        }

        const proposer = players[match.challengerId];
        const userIds = playerIds.map((id) => players[id]?.userId);

        if (currentUser && !userIds.includes(currentUser.id)) {
            if (!match.acceptedAt && userIds.some((id) => currentUser.avoidedUsers.includes(id))) {
                return false;
            }

            if (currentUser.isSoftBan && !proposer.elo.isEloEstablished) {
                return false;
            }

            if (currentPlayer && !currentPlayer.elo.isEloEstablished && proposer.isSoftBan) {
                return false;
            }
        }

        if (match.isCompetitive && !currentPlayerId) {
            return false;
        }

        if (match.isCompetitive && currentPlayerId) {
            if (!currentPlayer.elo.isEloEstablished) {
                return false;
            }

            const currentPlayerElo = currentPlayer.elo.elo;
            const proposerTlr = proposer.elo.elo;

            if (Math.abs(currentPlayerElo - proposerTlr) > config.maxCompetitiveTlrGap) {
                return false;
            }
        }

        if (match.isAgeCompatible) {
            const challenger = players[match.challengerId];
            if (!challenger?.isAgeCompatible) {
                return false;
            }
        }

        return matchFilter === 'all' ? true : !match.acceptedAt && match.playedAt > now;
    });

    const isMyTournament = Boolean(
        currentUser &&
        currentUser.tournaments[tournament.id]?.isActive &&
        !currentUser.tournaments[tournament.id]?.needPartner &&
        !currentUser.tournaments[tournament.id]?.partnerId
    );
    const isDoubles = tournament.levelType === 'doubles';
    const ActualProposal = isDoubles ? ProposalDoubles : Proposal;
    const ActualFormProposal = isDoubles ? FormDoublesProposal : FormProposal;

    return (
        <div className={style.wrapper}>
            <div className={classnames(style.list, { [style.doubles]: isDoubles })}>
                <Card>
                    <div className="d-flex justify-content-between align-items-center mb-6">
                        <h3 className="m-0">
                            Proposals
                            <span className="badge badge-secondary ms-2 align-middle">{proposals.length}</span>
                        </h3>
                        {isMyTournament && tournament.isStarted && (!tournament.isOver || tournament.isBreak) && (
                            <div>
                                <Modal
                                    title={tournament.isOver ? 'Propose Friendly Match' : 'Propose Match'}
                                    renderTrigger={({ show }) => (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={checkUserReady(show)}
                                        >
                                            Propose match
                                        </button>
                                    )}
                                    renderBody={({ hide }) => (
                                        <ActualFormProposal
                                            tournament={tournament}
                                            onSubmit={async (values) => {
                                                await reloadTournament();
                                                hide();
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>
                    {proposals.length === 0 && <div>No proposals found.</div>}
                    <div className={style.proposals}>
                        {proposals.map((match, index) => (
                            <LazyLoad key={match.id} height={100} once>
                                <ActualProposal
                                    key={match.id}
                                    match={match}
                                    tournament={tournament}
                                    onStatusUpdate={reloadTournament}
                                />
                            </LazyLoad>
                        ))}
                    </div>
                </Card>
            </div>

            <div className={style.filter}>
                <Card>
                    <h3>Filter</h3>
                    <button
                        type="button"
                        className={classnames('btn btn-sm me-2', matchFilter === 'all' ? 'btn-primary' : 'btn-light')}
                        onClick={() => setMatchFilter('all')}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        className={classnames(
                            'btn btn-sm me-2',
                            matchFilter === 'available' ? 'btn-primary' : 'btn-light'
                        )}
                        onClick={() => setMatchFilter('available')}
                    >
                        Available
                    </button>
                    {playerFilter}
                </Card>
            </div>
        </div>
    );
};

export default Proposals;
