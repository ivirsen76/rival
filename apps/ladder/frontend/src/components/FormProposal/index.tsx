import { useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import RadioModern from '@/components/formik/RadioModern';
import CheckboxArray from '@/components/formik/CheckboxArray';
import Checkbox from '@/components/formik/Checkbox';
import SelectButtons from '@/components/formik/SelectButtons';
import DoublesPlayersPicker from '@/components/formik/DoublesPlayersPicker';
import Button from '@/components/Button';
import dayjs from '@/utils/dayjs';
import confirmation from '@/utils/confirmation';
import useTournamentOptions from './useTournamentOptions';
import useVisibleStats from './useVisibleStats';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import DateTimeWithWeather from '@/components/DateTimeWithWeather';
import HiddenText from '@/components/HiddenText';
import { useSelector } from 'react-redux';
import practiceTypeOptions from '@rival/ladder.backend/src/services/proposals/practiceTypeOptions';
import matchFormatOptions from '@rival/ladder.backend/src/services/proposals/matchFormatOptions';
import durationOptions from '@rival/ladder.backend/src/services/proposals/durationOptions';
import classnames from 'classnames';
import style from './style.module.scss';

const getVisiblePlayers = (stats, values) => {
    if (!stats) {
        return '?';
    }

    function intersect(a, b) {
        return new Set([...a].filter((x) => b.has(x)));
    }

    let players = values.tournaments.reduce((set, id) => {
        if (stats.tournaments[id]) {
            for (const userId of stats.tournaments[id]) {
                set.add(userId);
            }
        }

        return set;
    }, new Set());

    if (values.isCompetitive) {
        players = intersect(players, new Set(stats.competitivePlayers));
    }

    if (values.isAgeCompatible) {
        players = intersect(players, new Set(stats.ageCompatiblePlayers));
    }

    return players.size;
};

const FormProposal = (props) => {
    const { initialValues, isPractice, onSubmit, tournament } = props;
    const [confirmed, setConfirmed] = useState(false);
    const tournamentOptions = useTournamentOptions(tournament.id);
    const visibleStats = useVisibleStats();
    const currentUser = useSelector((state) => state.auth.user);
    const currentPlayerId = currentUser.tournaments[tournament.id].playerId;
    const currentPlayer = tournament.players[currentPlayerId];

    const sundayInAWeek = dayjs.tz().add(1, 'week').isoWeekday(7).hour(12).minute(0).second(0);
    const endOfTournament = dayjs.tz(tournament.endDate).subtract(12, 'hour');
    const breakEnd = tournament.breakEnd
        ? dayjs.tz(tournament.breakEnd).subtract(12, 'hour')
        : dayjs.tz().add(1, 'year');

    const handleSubmit = async (values) => {
        let confirm = true;
        if (!confirmed && values.playedAt) {
            const playedAt = dayjs.tz(values.playedAt);
            const hours = playedAt.hour();

            if (hours < 6 || hours >= 21) {
                const time = playedAt.format('h:mm A');
                confirm = await confirmation({
                    confirmButtonTitle: "Yes, it's the right time",
                    message: `You picked ${time} at night. Are you sure about that?`,
                });
            }
        }
        if (!confirm) {
            return;
        }

        if (values.playedAt) {
            setConfirmed(true);
        }
        await axios.post('/api/proposals', values);
        await onSubmit(values);

        notification({
            header: 'Success',
            message: (
                <div>
                    Your proposal has been added.
                    <br />
                    An email has been sent to all players.
                </div>
            ),
        });
    };

    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const isFriendlyMatch = !isPractice && tournament.isBreak;
    const showCompetitiveProposal = Boolean(!isDoublesTeam && currentUser.establishedElo);
    const showAgeCompatibleProposal = Boolean(currentUser.birthday);
    const showMultiTournament = !isDoublesTeam && tournamentOptions.length > 1;
    const showAdvancedSettings = !isPractice;

    const getInitialValues = () => {
        const values = {
            place: '',
            comment: '',
            playedAt: '',
            tournaments: [tournament.id],
        };

        if (isDoublesTeam) {
            values.challengers =
                currentPlayer.partners.length === 2
                    ? [currentPlayer.id, currentPlayer.partners.find((item) => item.id !== currentPlayer.id).id]
                    : [currentPlayer.id];
        }

        if (isPractice) {
            values.practiceType = 1;
            values.duration = 60;
        }

        if (!isPractice) {
            values.matchFormat = 0;
        }

        return {
            ...values,
            ...initialValues,
        };
    };

    const needPickPlayers = isDoublesTeam && currentPlayer.partners.length > 2;

    return (
        <Formik initialValues={getInitialValues()} onSubmit={handleSubmit}>
            {({ isSubmitting, values, setFieldValue }) => {
                const totalPlayers = getVisiblePlayers(visibleStats, values);

                return (
                    <Form noValidate>
                        {isDoublesTeam && (
                            <div className="alert alert-primary mb-6">
                                <b>Notice!</b> You&apos;re going to be the contact for this match.
                            </div>
                        )}
                        {isFriendlyMatch && (
                            <div className="alert alert-primary mb-6">
                                <b>Notice!</b> The score isn&apos;t reported for friendly match.
                            </div>
                        )}
                        {needPickPlayers && (
                            <Field
                                name="challengers"
                                component={DoublesPlayersPicker}
                                partners={currentPlayer.partners}
                            />
                        )}
                        <DateTimeWithWeather
                            minDate={dayjs.tz().hour(12).minute(0).second(0)}
                            maxDate={
                                tournament.isBreak
                                    ? dayjs.min(sundayInAWeek, breakEnd)
                                    : dayjs.min(sundayInAWeek, endOfTournament)
                            }
                        />
                        <Field name="place" label="Location" component={Input} />
                        {isPractice && (
                            <>
                                <Field
                                    name="practiceType"
                                    label="What do you want to practice?"
                                    component={RadioModern}
                                    options={practiceTypeOptions}
                                    alwaysShowDescription
                                    allowUnselect={false}
                                />
                                <Field
                                    name="duration"
                                    label="Practice duration:"
                                    options={durationOptions}
                                    component={SelectButtons}
                                />
                            </>
                        )}
                        <Field
                            name="comment"
                            label="Comment"
                            description="Flexibility, address, court fees, etc."
                            component={Input}
                        />
                        {showAdvancedSettings && (
                            <HiddenText title="Advanced settings" className="mb-8">
                                <div className="mb-n6">
                                    <div className="mb-4">
                                        <div className="badge badge-primary">
                                            Visible to {totalPlayers} player{totalPlayers === 1 ? '' : 's'}
                                        </div>
                                    </div>

                                    {showMultiTournament && (
                                        <Field
                                            name="tournaments"
                                            label="Create a Proposal for Multiple Ladders"
                                            description="Once accepted in one ladder, the other proposals will be deleted automatically."
                                            component={CheckboxArray}
                                            options={tournamentOptions}
                                        />
                                    )}

                                    <div className="mb-6">
                                        <label className="form-label">Match format</label>
                                        <div className="btn-group w-100">
                                            {matchFormatOptions.map((item) => (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    className={classnames(
                                                        style.number,
                                                        item.value === values.matchFormat && style.active
                                                    )}
                                                    style={{ flexBasis: 1, flexGrow: 1 }}
                                                    onClick={() => setFieldValue('matchFormat', item.value)}
                                                >
                                                    <div>{item.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className={style.matchFormatDescriptions}>
                                            {matchFormatOptions.map((item) => (
                                                <div key={item.value}>{item.description}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {showCompetitiveProposal && (
                                        <Field
                                            name="isCompetitive"
                                            label="Competitive proposal"
                                            description="Only visible to players 0.25 TLR above or below your level"
                                            component={Checkbox}
                                        />
                                    )}

                                    {showAgeCompatibleProposal && (
                                        <Field
                                            name="isAgeCompatible"
                                            label="Age-compatible proposal"
                                            description="Only visible to players 15 years younger or older"
                                            component={Checkbox}
                                        />
                                    )}
                                </div>
                            </HiddenText>
                        )}
                        <Button isSubmitting={isSubmitting}>{isPractice ? 'Propose practice' : 'Propose match'}</Button>
                    </Form>
                );
            }}
        </Formik>
    );
};

FormProposal.propTypes = {
    initialValues: PropTypes.object,
    isPractice: PropTypes.bool,
    onSubmit: PropTypes.func,
    tournament: PropTypes.object,
};

export default FormProposal;
