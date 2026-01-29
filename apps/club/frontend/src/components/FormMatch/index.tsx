import { useState } from 'react';
import classnames from 'classnames';
import SetForm from './SetForm';
import MatchPreview from './MatchPreview';
import {
    getPoints,
    isFullScoreCorrect,
    isFastScoreCorrect,
    isFullSetScoreCorrect,
    isFastSetScoreCorrect,
    isInjuryFullSetScoreCorrect,
    isInjuryFastSetScoreCorrect,
    getLocalDateThisWeek,
} from '@rival/club.backend/src/services/matches/helpers';
import { Formik, Field, Form } from '@/components/formik';
import TimePicker from '@/components/formik/TimePicker';
import HtmlSelect from '@/components/formik/HtmlSelect';
import Select from '@/components/formik/Select';
import Button from '@rival/common/components/Button';
import notification from '@/components/notification';
import PlayerName from '@/components/PlayerName';
import axios from '@/utils/axios';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
import { useSelector } from 'react-redux';
import confirmation from '@rival/common/utils/confirmation';
import { formatCustom } from '@/utils/dayjs';
import getScoreAsString from './getScoreAsString';
import InjuryForm from './InjuryForm';
import _isEqual from 'lodash/isEqual';
import _pick from 'lodash/pick';
import { getAvailableSets } from './utils';
import FormPickDoublesPlayers from '@/components/FormPickDoublesPlayers';
import DefaultIcon from '@/assets/default.svg?react';
import FinishIcon from '@/assets/cup.svg?react';
import InjuryIcon from '@/components/InjuryIcon';
import { getListAsString } from '@rival/club.backend/src/utils/helpers';
import style from './style.module.scss';

const matchFormatOptions = [
    { value: 0, label: 'Full match' },
    { value: 2, label: 'Fast4' },
];

export const validate = (values) => {
    const errors = {};

    const score = values.score.slice(0, values.currentSetNumber);
    const currentSet = score[values.currentSetNumber - 1];
    const isFast4 = values.matchFormat === 2;
    const isSetScoreCorrect = isFast4 ? isFastSetScoreCorrect : isFullSetScoreCorrect;
    const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;
    const isInjurySetScoreCorrect = isFast4 ? isInjuryFastSetScoreCorrect : isInjuryFullSetScoreCorrect;

    if (currentSet[0] === null || currentSet[1] === null) {
        return {};
    }

    if (values.wonByInjury) {
        const scoreStr = score.map((item) => item.join('-')).join(' ');

        if (isScoreCorrect(scoreStr, false)) {
            errors.score = 'Retirement score should be incomplete.';
        } else if (!isInjurySetScoreCorrect({ challengerPoints: currentSet[0], acceptorPoints: currentSet[1] })) {
            errors.score = 'The score is incorrect.';
        }
    } else if (
        !isSetScoreCorrect({
            challengerPoints: currentSet[0],
            acceptorPoints: currentSet[1],
            isMatchTieBreak: values.currentSetNumber === 3 && values.isMatchTieBreak,
        })
    ) {
        errors.score = 'The score is incorrect.';
    }

    return errors;
};

type FormMatchProps = {
    match: object;
    tournament: object;
    onUpdate: (...args: unknown[]) => unknown;
};

const FormMatch = (props: FormMatchProps) => {
    const { tournament, onUpdate } = props;
    const { players } = tournament;
    const [swipeDirection, setSwipeDirection] = useState('right');
    const currentUser = useSelector((state) => state.auth.user);
    const [match, setMatch] = useState(() => ({ ...props.match }));

    const challenger = players[match.challengerId];
    const challenger2 = players[match.challenger2Id];
    const acceptor = players[match.acceptorId];
    const acceptor2 = players[match.acceptor2Id];

    const isDoubles = tournament.levelType === 'doubles';
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const challengerName = <PlayerName player1={challenger} player2={challenger2} />;
    const acceptorName = <PlayerName player1={acceptor} player2={acceptor2} />;

    const challengerCaptain = isDoublesTeam && challenger.partners?.[0];
    const acceptorCaptain = isDoublesTeam && acceptor.partners?.[0];

    const sets = [
        { value: 1, label: 'Set 1' },
        { value: 2, label: 'Set 2' },
        { value: 3, label: 'Set 3' },
    ];

    const updateMatch = async (values) => {
        const score = getScoreAsString(values);
        let result;

        if (match.id) {
            // Updating match
            result = await axios.patch(`/api/matches/${match.id}`, {
                score,
                playedAt: values.playedAt,
                matchFormat: values.matchFormat,
                wonByDefault: values.wonByDefault,
                wonByInjury: values.wonByInjury,
                ...(values.wonByInjury
                    ? { winner: values.injuredPlayerId === match.challengerId ? match.acceptorId : match.challengerId }
                    : {}),
                ...(isDoubles || isDoublesTeam
                    ? {
                          challengerId: match.challengerId,
                          challenger2Id: match.challenger2Id,
                          acceptorId: match.acceptorId,
                          acceptor2Id: match.acceptor2Id,
                      }
                    : {}),
            });
        } else {
            if (!isDoubles && !isDoublesTeam) {
                const response = await axios.put('/api/matches/0', {
                    action: 'checkDuplicatedMatch',
                    challengerUserId: challenger.userId,
                    acceptorUserId: acceptor.userId,
                    playedAt: values.playedAt,
                });

                const duplicatedMatch = response.data.match;
                if (duplicatedMatch) {
                    const date = formatCustom(values.playedAt, 'MMMM D');
                    const confirm = await confirmation({
                        title: 'Duplicated match?',
                        confirmButtonTitle: "Yes, it's another match",
                        message: (
                            <div>
                                <p>
                                    The match between {challengerName} and {acceptorName} has already been reported for{' '}
                                    {date} in {duplicatedMatch.levelName} with the score{' '}
                                    <span className="text-nowrap">{duplicatedMatch.score}</span>.
                                </p>
                                Are you sure that you played another match{' '}
                                <span className="text-nowrap">on {date}</span>?
                            </div>
                        ),
                    });

                    if (!confirm) {
                        return;
                    }
                }
            }

            // Creating new match
            result = await axios.post('/api/matches', {
                ...match,
                score,
                playedAt: values.playedAt,
                matchFormat: values.matchFormat,
                wonByDefault: values.wonByDefault,
                wonByInjury: values.wonByInjury,
                ...(values.wonByInjury
                    ? { winner: values.injuredPlayerId === match.challengerId ? match.acceptorId : match.challengerId }
                    : {}),
            });
        }

        if (onUpdate) {
            await onUpdate();
        }

        if (result?.data?.multiLadderMatchAlert && result?.data?.multiLadderMatch) {
            const opponent = challenger.userId === currentUser.id ? acceptor : challenger;

            notification({
                inModal: true,
                message: (
                    <div>
                        <p>The match has been reported.</p>
                        <p>
                            Since you and {opponent.firstName} {opponent.lastName} play in the{' '}
                            {getListAsString(result.data.multiLadderMatch)} ladders, the match will be reported in each
                            ladder.
                        </p>
                    </div>
                ),
            });
        } else {
            notification({
                header: 'Success',
                message: 'The match has been reported.',
            });
        }
    };

    const setCurrentSetAndSwipeDirection = (values, setFieldValue, num) => {
        if (num === values.currentSetNumber) {
            return;
        }

        const direction = num > values.currentSetNumber ? 'right' : 'left';
        setSwipeDirection(direction);
        setFieldValue('currentSetNumber', num);
    };

    const playedAt = getLocalDateThisWeek(match.playedAt);
    const getAverageRank = (rank1, rank2) => Math.floor((rank1 + rank2) / 2);

    const onChangeMatchFormat = (value, values, setValues) => {
        setSwipeDirection('left');
        setValues({
            ...values,
            isMatchTieBreak: true,
            score: [
                [null, null],
                [null, null],
                [null, null],
            ],
            currentSetNumber: 1,
            matchFormat: value,
        });
    };

    const onChangeMatchResult = (value, values, setValues) => {
        const newValues = {
            ...values,
            wonByDefault: false,
            wonByInjury: false,
            injuredPlayerId: 0,
            isMatchTieBreak: false,
            score: [
                [null, null],
                [null, null],
                [null, null],
            ],
            currentSetNumber: 1,
            result: value,
        };

        if (value === 'default') {
            newValues.wonByDefault = true;
            newValues.matchFormat = 0;

            if (challenger.userId === currentUser.id) {
                newValues.score = [
                    [6, 0],
                    [6, 0],
                    [null, null],
                ];
            } else {
                newValues.score = [
                    [0, 6],
                    [0, 6],
                    [null, null],
                ];
            }
            newValues.currentSetNumber = 2;

            setValues(newValues);
        } else if (value === 'injury') {
            newValues.wonByInjury = true;

            notification({
                inModal: true,
                title: 'Injury Details',
                render: ({ hide }) => {
                    return (
                        <InjuryForm
                            challenger={challenger}
                            acceptor={acceptor}
                            injuredPlayerId={challenger.userId === currentUser.id ? acceptor.id : challenger.id}
                            onSubmit={(playerId) => {
                                hide();
                                setValues({
                                    ...newValues,
                                    ..._pick(values, ['isMatchTieBreak', 'score', 'currentSetNumber']),
                                    injuredPlayerId: playerId,
                                });
                            }}
                            hide={hide}
                        />
                    );
                },
            });
        } else {
            setValues(newValues);
        }
    };

    const resultOptions = [
        {
            value: 'regular',
            label: (
                <div className={style.matchResult}>
                    <div className={style.icon}>
                        <FinishIcon />
                    </div>
                    Match completed
                </div>
            ),
        },
        {
            value: 'default',
            label: (
                <div className={style.matchResult}>
                    <div className={style.icon}>
                        <DefaultIcon />
                    </div>
                    {isDoublesTeam ? 'Team defaulted' : 'Player defaulted'}
                </div>
            ),
        },
    ];
    if (!isDoubles) {
        resultOptions.push({
            value: 'injury',
            label: (
                <div className={style.matchResult}>
                    <div className={style.icon}>
                        <InjuryIcon />
                    </div>
                    {isDoublesTeam ? 'Team retired' : 'Player retired'}
                </div>
            ),
        });
    }

    const initialScore = [
        [null, null],
        [null, null],
        [null, null],
    ];
    if (match.score) {
        match.score.split(' ').forEach((item, index) => {
            initialScore[index] = item.split('-').map(Number);
        });
    }

    const needPickPlayers =
        !challenger2 && !acceptor2 && (challenger.partnerIds?.length > 2 || acceptor.partnerIds?.length > 2);

    if (needPickPlayers) {
        return (
            <FormPickDoublesPlayers
                match={match}
                players={players}
                onSubmit={(values) => {
                    setMatch({ ...match, ...values });
                }}
            />
        );
    }

    return (
        <Formik
            initialValues={{
                score: initialScore,
                playedAt,
                wonByDefault: Boolean(match.wonByDefault),
                wonByInjury: Boolean(match.wonByInjury),
                injuredPlayerId: (() => {
                    if (!match.wonByInjury) {
                        return 0;
                    }

                    return match.winner === match.challengerId ? match.acceptorId : match.challengerId;
                })(),
                isMatchTieBreak: (() => {
                    if (match.matchFormat === 2) {
                        return true;
                    }
                    if (match.matchFormat === 1) {
                        return false;
                    }
                    if (match.wonByInjury) {
                        return false;
                    }

                    return initialScore[2].reduce((sum, num) => sum + (num || 0), 0) < 2;
                })(),
                currentSetNumber: 1,
                result: match.wonByDefault ? 'default' : match.wonByInjury ? 'injury' : 'regular',
                matchFormat: match.matchFormat,
            }}
            validate={validate}
            onSubmit={updateMatch}
        >
            {({ isSubmitting, handleSubmit, setFieldValue, setValues, values, errors }) => {
                const isFast4 = values.matchFormat === 2;
                const currentScore = getScoreAsString(values);
                const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;
                const matchWithScore = {
                    ...match,
                    score: currentScore,
                    challengerRank: (challengerCaptain || challenger).stats.rank,
                    acceptorRank: (acceptorCaptain || acceptor).stats.rank,
                    wonByDefault: values.wonByDefault ? 1 : 0,
                    wonByInjury: values.wonByInjury ? 1 : 0,
                    matchFormat: values.matchFormat,
                    ...getPoints({
                        ...match,
                        wonByDefault: values.wonByDefault ? 1 : 0,
                        wonByInjury: values.wonByInjury ? 1 : 0,
                        matchFormat: values.matchFormat,
                        ...(values.wonByInjury
                            ? {
                                  winner:
                                      values.injuredPlayerId === match.challengerId
                                          ? match.acceptorId
                                          : match.challengerId,
                              }
                            : {}),
                        score: currentScore,
                        challengerRank: isDoubles
                            ? getAverageRank(challenger.stats.rank, challenger2.stats.rank)
                            : (challengerCaptain || challenger).stats.rank,
                        acceptorRank: isDoubles
                            ? getAverageRank(acceptor.stats.rank, acceptor2.stats.rank)
                            : (acceptorCaptain || acceptor).stats.rank,
                    }),
                };
                const availableSets = getAvailableSets(values.score, isFast4, values.wonByInjury);

                return (
                    <Form noValidate>
                        <div className="d-flex gap-4">
                            <Field label="Played at" name="playedAt" component={TimePicker} />
                            <Field
                                label="Match format"
                                name="matchFormat"
                                options={matchFormatOptions}
                                component={Select}
                                wrapperClassName="mb-6 flex-grow-1"
                                onChange={(value) => {
                                    onChangeMatchFormat(value, values, setValues);
                                }}
                                disabled={Boolean(values.wonByDefault)}
                            />
                        </div>

                        <Field
                            name="result"
                            options={resultOptions}
                            component={HtmlSelect}
                            onChange={(value) => {
                                onChangeMatchResult(value, values, setValues);
                            }}
                        />

                        <div className="notice bg-light-primary rounded border-primary border border-dashed p-6">
                            {values.wonByDefault ? (
                                <>
                                    <div>
                                        <label className="form-label">Who won?</label>
                                    </div>
                                    <div className="btn-group-vertical">
                                        <button
                                            type="button"
                                            className={classnames(
                                                style.number,
                                                style.vertical,
                                                'ps-4 pe-4',
                                                _isEqual(values.score[0], [6, 0]) && style.active
                                            )}
                                            onClick={() => {
                                                setFieldValue('score', [
                                                    [6, 0],
                                                    [6, 0],
                                                    [null, null],
                                                ]);
                                            }}
                                        >
                                            {challengerName}
                                        </button>
                                        <button
                                            type="button"
                                            className={classnames(
                                                style.number,
                                                style.vertical,
                                                'ps-4 pe-4',
                                                _isEqual(values.score[0], [0, 6]) && style.active
                                            )}
                                            onClick={() => {
                                                setFieldValue('score', [
                                                    [0, 6],
                                                    [0, 6],
                                                    [null, null],
                                                ]);
                                            }}
                                        >
                                            {acceptorName}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center justify-content-between mb-6">
                                        <ul className="nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-4 fw-semibold">
                                            {sets.map((set) => {
                                                const isDisabled = !availableSets.includes(set.value);

                                                return (
                                                    <li key={set.value} className="nav-item">
                                                        <a
                                                            href=""
                                                            className={classnames(
                                                                'nav-link text-active-primary pb-0 pt-0',
                                                                {
                                                                    active: set.value === values.currentSetNumber,
                                                                    disabled: isDisabled,
                                                                }
                                                            )}
                                                            onClick={(e) => {
                                                                e.preventDefault();

                                                                if (!isDisabled) {
                                                                    setCurrentSetAndSwipeDirection(
                                                                        values,
                                                                        setFieldValue,
                                                                        set.value
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {set.label}
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    <ReactCSSTransitionReplace
                                        transitionName={swipeDirection}
                                        transitionEnterTimeout={500}
                                        transitionLeaveTimeout={500}
                                    >
                                        <SetForm
                                            key={values.currentSetNumber}
                                            challengerName={challengerName}
                                            acceptorName={acceptorName}
                                            values={values}
                                            setValues={setValues}
                                            goToNextSet={() =>
                                                setCurrentSetAndSwipeDirection(
                                                    values,
                                                    setFieldValue,
                                                    values.currentSetNumber + 1
                                                )
                                            }
                                            errors={errors}
                                        />
                                    </ReactCSSTransitionReplace>
                                </>
                            )}
                        </div>

                        <h3>Preview</h3>
                        <div className="mb-6">
                            <MatchPreview match={matchWithScore} tournament={tournament} />
                        </div>
                        <Button
                            disabled={!values.wonByInjury && !isScoreCorrect(currentScore)}
                            onClick={handleSubmit}
                            isSubmitting={isSubmitting}
                        >
                            Report match
                        </Button>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default FormMatch;
