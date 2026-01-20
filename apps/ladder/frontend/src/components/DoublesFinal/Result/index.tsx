import { useRef } from 'react';
import PropTypes from 'prop-types';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Modal from '@/components/Modal';
import { useSelector } from 'react-redux';
import NumberPicker from './NumberPicker';
import { Formik, Form } from '@/components/formik';
import axios from '@/utils/axios';
import Button from '@/components/Button';
import classnames from 'classnames';
import { formatMiddle } from '@/utils/dayjs';
import hasAnyRole from '@/utils/hasAnyRole';
import Tooltip from '@/components/Tooltip';
import OtherIcon from '@rival/packages/metronic/icons/duotone/General/Other2.svg?react';
import compareFields from '@rival/ladder.backend/src/utils/compareFields';
import { BYE_ID } from '@rival/ladder.backend/src/constants';
import style from './style.module.scss';

export const getPoints = (score) => {
    const positions = [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
    ];

    return positions.map((position) =>
        score.reduce((sum, pair, index) => {
            return sum + (pair[position[index]] || 0);
        }, 0)
    );
};

const RoundRobin = (props) => {
    const { match, player1, player2, player3, player4 } = props;

    const options = [
        [0, 1, 2, 3],
        [0, 2, 1, 3],
        [0, 3, 1, 2],
    ];

    const renderPart = (pair, score, setFieldValue) => {
        const list = [player1, player2, player3, player4];
        const getPlayer = (num) => list[options[pair][num - 1]];

        const changeScore = async (index, value) => {
            const scorePair = Math.floor(index / 2);
            const first = index % 2 ? 8 - value : value;
            const second = 8 - first;

            const newScore = score.map((v, i) => (i === scorePair ? [first, second] : v));
            setFieldValue('score', newScore);
        };

        return (
            <table className={style.match}>
                <tbody>
                    <tr>
                        <td>
                            <PlayerAvatar player1={getPlayer(1)} player2={getPlayer(2)} className="me-2" />
                        </td>
                        <td>
                            <PlayerName player1={getPlayer(1)} player2={getPlayer(2)} />
                        </td>
                        <td className="ps-4" data-number-picker={pair * 2}>
                            <NumberPicker value={score[pair][0]} onChange={(num) => changeScore(pair * 2, num)} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <PlayerAvatar player1={getPlayer(3)} player2={getPlayer(4)} className="me-2" />
                        </td>
                        <td>
                            <PlayerName player1={getPlayer(3)} player2={getPlayer(4)} />
                        </td>
                        <td className="ps-4" data-number-picker={pair * 2 + 1}>
                            <NumberPicker value={score[pair][1]} onChange={(num) => changeScore(pair * 2 + 1, num)} />
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    };

    const onSubmit = async (values) => {
        await axios.put(`/api/doublesmatches/${match.id}`, {
            action: 'setScore',
            score: values.score,
        });
        await props.onChange();
    };

    return (
        <Formik
            initialValues={{
                score: [
                    match.score1 ? match.score1.split('-').map(Number) : [],
                    match.score2 ? match.score2.split('-').map(Number) : [],
                    match.score3 ? match.score3.split('-').map(Number) : [],
                ],
            }}
            onSubmit={onSubmit}
        >
            {({ setFieldValue, values }) => {
                const isScoreComplete =
                    values.score.reduce((sum, round) => {
                        return sum + (round.length === 0 ? 0 : round[0] + round[1]);
                    }, 0) === 24;

                return (
                    <Form noValidate>
                        <label className="form-label mb-6">
                            Here&apos;s the order you&apos;ll play each round of 8 games:
                        </label>
                        <div className={style.list}>
                            {options.map((list, index) => (
                                <div key={index} className="d-flex">
                                    <div className={'pe-3 ' + style.number}>{index + 1}.</div>
                                    <div className={style.matchWrapper}>
                                        {renderPart(index, values.score, setFieldValue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button disabled={!isScoreComplete}>Submit</Button>
                    </Form>
                );
            }}
        </Formik>
    );
};

RoundRobin.propTypes = {
    match: PropTypes.object,
    player1: PropTypes.object,
    player2: PropTypes.object,
    player3: PropTypes.object,
    player4: PropTypes.object,
    onChange: PropTypes.func,
};

const Result = (props) => {
    const currentUser = useSelector((state) => state.auth.user);
    const { match, player1, player2, player3, player4, finalSpot, winnerCount, readOnly } = props;
    const tooltipRef = useRef();

    const arr = [player1, player2, player3, player4];
    const userIds = arr.map((player) => player?.userId);
    const isMyMatch = currentUser && userIds.includes(currentUser.id);
    const isAdmin = hasAnyRole(currentUser, ['admin', 'manager']);
    const hasAllPlayers = userIds.every(Boolean);
    const hasBye = arr.some((player) => player.id === BYE_ID);
    const isPlayed = Boolean(match.score1);
    const points = getPoints([
        match.score1 ? match.score1.split('-').map(Number) : [],
        match.score2 ? match.score2.split('-').map(Number) : [],
        match.score3 ? match.score3.split('-').map(Number) : [],
    ]);

    const hasScore = points.reduce((sum, num) => sum + num, 0) === 48;
    const winners = (() => {
        if (hasBye) {
            return arr.map((player) => player.id).filter((id) => id && id !== BYE_ID);
        }

        if (!hasScore) {
            return [];
        }

        return arr
            .map((player, index) => ({ ...player, points: points[index] }))
            .sort(
                compareFields(
                    'points-desc',
                    'stats.rank',
                    'stats.matches-desc',
                    'stats.matchesWon-desc',
                    'firstName',
                    'lastName'
                )
            )
            .map((player) => player.id)
            .slice(0, finalSpot === 1 ? 1 : winnerCount);
    })();

    const actions = [];
    if (isPlayed && (isMyMatch || isAdmin) && hasAllPlayers && !readOnly) {
        actions.push(
            <Modal
                key="edit"
                title="Edit match"
                hasForm={false}
                renderTrigger={({ show }) => (
                    <button type="button" className="btn btn-primary btn-sm" onClick={show} data-edit-match={finalSpot}>
                        Edit
                    </button>
                )}
                size="sm"
                renderBody={({ hide }) => (
                    <RoundRobin
                        {...props}
                        onChange={async () => {
                            await props.reloadTournament();
                            hide();
                        }}
                    />
                )}
            />
        );
    }

    return (
        <div data-doubles-final-result={finalSpot} className={style.resultWrapper}>
            <div className={style.header}>
                <div className={style.time}>{match.playedAt ? formatMiddle(match.playedAt) : null}</div>
                <div className={style.icons}>
                    {!isPlayed && (isMyMatch || isAdmin) && hasAllPlayers && !readOnly ? (
                        <Modal
                            title="Order of play and Score"
                            hasForm={false}
                            renderTrigger={({ show }) => (
                                <a
                                    href=""
                                    className="btn btn-success btn-xs"
                                    style={{ marginBottom: '-0.2rem' }}
                                    data-order-of-play={finalSpot}
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        show();
                                    }}
                                >
                                    Order of play and Score
                                </a>
                            )}
                            size="sm"
                            renderBody={({ hide }) => (
                                <RoundRobin
                                    {...props}
                                    onChange={async () => {
                                        await props.reloadTournament();
                                        hide();
                                    }}
                                />
                            )}
                        />
                    ) : (
                        <>&nbsp;</>
                    )}
                    {actions.length > 0 && (
                        <Tooltip
                            interactive
                            placement="bottom-start"
                            trigger="click"
                            arrow={false}
                            offset={[0, 2]}
                            theme="light"
                            content={
                                <div
                                    className="d-grid m-2"
                                    style={{ gridGap: '0.5rem', whiteSpace: 'normal' }}
                                    onClick={() => {
                                        tooltipRef.current && tooltipRef.current.hide();
                                    }}
                                >
                                    {actions}
                                </div>
                            }
                            onShow={(instance) => {
                                tooltipRef.current = instance;
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-link btn-color-muted btn-active-color-primary p-0"
                                data-match-actions={finalSpot}
                            >
                                <span className="svg-icon svg-icon-2">
                                    <OtherIcon />
                                </span>
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>
            {arr.map((player, index) => (
                <div key={player.id + '-' + index} className={style.playerWrapper}>
                    <div className={classnames(style.player, { [style.winner]: winners.includes(player.id) })}>
                        <div>
                            <PlayerAvatar
                                player1={player}
                                className={classnames('me-2', { [style.bye]: !player.id || player.id === BYE_ID })}
                            />
                        </div>
                        <div>
                            {(() => {
                                if (player.id === BYE_ID) {
                                    return '(BYE)';
                                }
                                if (!player.id) {
                                    return null;
                                }

                                return (
                                    <PlayerName
                                        player1={player}
                                        rank1={match[`player${index + 1}Seed`]}
                                        className="me-4"
                                    />
                                );
                            })()}
                        </div>
                        {hasScore && (
                            <div>
                                <div className={'badge badge-square badge-dark ' + style.pointResult}>
                                    {points[index]}
                                </div>
                            </div>
                        )}
                        {index === 1 && <div className={style.flag} data-match-middle={finalSpot} />}
                    </div>
                </div>
            ))}
        </div>
    );
};

Result.propTypes = {
    match: PropTypes.object,
    players: PropTypes.object,
    player1: PropTypes.object,
    player2: PropTypes.object,
    player3: PropTypes.object,
    player4: PropTypes.object,
    reloadTournament: PropTypes.func,
    finalSpot: PropTypes.number,
    readOnly: PropTypes.bool,

    // number of open slots
    winnerCount: PropTypes.number,
};

export default Result;
