import { useState } from 'react';
import axios from '@rival/common/axios';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@rival/common/components/Button';
import Loader from '@rival/common/components/Loader';
import Modal from '@rival/common/components/Modal';
import TournamentText from '@/components/TournamentText';
import CancelMessage from '@/components/CancelMessage';
import { loadCurrentUser } from '@/reducers/auth';
import { getSinglesTournament8Text, getSinglesTournament12Text, getSinglesTournament16Text } from '../texts';
import confirmation from '@rival/common/utils/confirmation';
import formatElo from '@rival/club.backend/src/utils/formatElo';

const GO_MESSAGE = 'You are registered for the tournament!';
const SKIP_MESSAGE = "You've decided to skip the tournament.";
const WAITING_MESSAGE = 'The Team Captain can change participation status.';

type FinalParticipationProps = {
    tournament: object;
    onStatusUpdate: (...args: unknown[]) => unknown;
    allowUpdate: boolean;
};

const FinalParticipation = (props: FinalParticipationProps) => {
    const { tournament, onStatusUpdate, allowUpdate } = props;
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);

    const { playerId, readyForFinal, seasonId } = currentUser.tournaments[tournament.id];
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const isTop12 = tournament.playersBeforeDeadline >= 50;
    const isTop16 = tournament.playersBeforeDeadline >= 75;
    const currentPlayer = tournament.players[playerId];

    const anotherTournament = Object.values(currentUser.tournaments).find(
        (item) =>
            item.isActive &&
            item.seasonId === seasonId &&
            item.readyForFinal === 1 &&
            item.playerId !== playerId &&
            item.levelType === tournament.levelType
    );

    const matchesPlayed = (() => {
        if (!currentPlayer) {
            return 0;
        }

        return currentPlayer.stats.live.matches;
    })();

    const changeStatus = async (value) => {
        setLoading(value);
        await axios.patch(`/api/players/${playerId}`, { readyForFinal: value });
        await onStatusUpdate();
        await dispatch(loadCurrentUser());
        setLoading(false);
    };

    const playerNumber = isTop16 ? 16 : isTop12 ? 12 : 8;

    const tournamentText = (() => {
        const entity = isDoublesTeam ? 'team' : 'player';

        return isTop16
            ? getSinglesTournament16Text(entity)
            : isTop12
              ? getSinglesTournament12Text(entity)
              : getSinglesTournament8Text(entity);
    })();

    let tournamentRules;
    if (tournamentText) {
        tournamentRules = (
            <div className="mb-4">
                <Modal
                    title="Tournament information"
                    hasForm={false}
                    size="lg"
                    renderTrigger={({ show }) => (
                        <a
                            href=""
                            onClick={(e) => {
                                e.preventDefault();
                                show();
                            }}
                        >
                            Tournament information
                        </a>
                    )}
                    renderBody={({ hide }) => <TournamentText text={tournamentText} tournament={tournament} />}
                />
            </div>
        );
    }

    return (
        <div data-final-participation>
            <h3>Final Tournament</h3>
            {(() => {
                if (tournament.cancelFinalTournament) {
                    return <CancelMessage tournament={tournament} />;
                }

                if (!allowUpdate) {
                    return (
                        <>
                            {tournamentRules}
                            <div>
                                {readyForFinal === 0
                                    ? WAITING_MESSAGE
                                    : readyForFinal === 1
                                      ? GO_MESSAGE
                                      : SKIP_MESSAGE}
                            </div>
                        </>
                    );
                }

                if (currentPlayer.isStartingTlrTooHigh) {
                    return (
                        <>
                            {tournamentRules}
                            <div>
                                Your TLR of <b>{formatElo(currentPlayer.startingTlr)}</b> at the beginning of this
                                season disqualifies you from participating in the Final Tournament for this ladder.
                            </div>
                        </>
                    );
                }

                if (currentPlayer.isInitialTlrTooHigh) {
                    return (
                        <>
                            {tournamentRules}
                            <div>
                                Your initial TLR of <b>{formatElo(currentPlayer.initialTlr)}</b> disqualifies you from
                                participating in the Final Tournament for this ladder.
                            </div>
                        </>
                    );
                }

                if (currentPlayer.isProjectedTlrTooHigh) {
                    return (
                        <>
                            {tournamentRules}
                            <div>
                                Your current TLR trajectory disqualifies you from participating in the Final Tournament
                                for this ladder.
                            </div>
                        </>
                    );
                }

                if (anotherTournament) {
                    return (
                        <>
                            {tournamentRules}
                            <div>{`You've already signed up for the ${anotherTournament.levelName} tournament.`}</div>
                        </>
                    );
                }

                if (matchesPlayed < 1) {
                    return (
                        <>
                            {tournamentRules}
                            <div>
                                {isDoublesTeam ? 'Your team ' : 'You '}must play at least one match to register for the
                                tournament. It&apos;s not too late to play!
                            </div>
                        </>
                    );
                }

                return readyForFinal === 0 ? (
                    <>
                        {tournamentRules}
                        <p>
                            The Top {playerNumber} {isDoublesTeam ? 'teams' : 'players'} who register will participate
                            in the Final Tournament beginning next week. {isDoublesTeam ? 'Is your team' : 'Are you'}{' '}
                            available to play? (You can change your mind later.)
                        </p>
                        <div>
                            <Button
                                className="btn btn-primary me-2"
                                isSubmitting={loading === 1}
                                onClick={async () => {
                                    if (playerNumber > 4) {
                                        const confirm = await confirmation({
                                            title: 'Final Tournament Participation',
                                            confirmButtonTitle: isDoublesTeam ? 'We are going' : 'I am going',
                                            message: (
                                                <div>
                                                    <p>
                                                        The tournament will occur <b>over two weeks</b>. Only register
                                                        if {isDoublesTeam ? 'your team' : 'you'} can play the entirety
                                                        of the tournament.
                                                    </p>
                                                    <div>
                                                        {isDoublesTeam ? 'Is your team' : 'Are you'} going to play in
                                                        the tournament?
                                                    </div>
                                                </div>
                                            ),
                                        });
                                        if (!confirm) {
                                            return;
                                        }
                                    }
                                    changeStatus(1);
                                }}
                                disabled={Boolean(loading)}
                            >
                                {isDoublesTeam ? 'We are going' : 'I am going'}
                            </Button>
                            <Button
                                className="btn btn-primary me-2"
                                isSubmitting={loading === 2}
                                onClick={() => changeStatus(2)}
                                disabled={Boolean(loading)}
                            >
                                {isDoublesTeam ? 'We' : 'I'} will skip
                            </Button>
                        </div>
                    </>
                ) : (
                    <div>
                        {tournamentRules}
                        {readyForFinal === 1 ? GO_MESSAGE : SKIP_MESSAGE}{' '}
                        <a
                            href=""
                            onClick={(e) => {
                                e.preventDefault();
                                changeStatus(0);
                            }}
                            className="text-nowrap"
                        >
                            Changed your mind?
                        </a>
                        <Loader loading={loading !== false} />
                    </div>
                );
            })()}
        </div>
    );
};

FinalParticipation.defaultProps = {
    allowUpdate: true,
};

export default FinalParticipation;
