import { useState, useMemo, useEffect } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import DateTimeWithWeather from '@/components/DateTimeWithWeather';
import Button from '@rival/common/components/Button';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import notification from '@/components/notification';
import dayjs from '@/utils/dayjs';
import confirmation from '@rival/common/utils/confirmation';
import { useSelector } from 'react-redux';
import CloseIcon from '@rival/common/metronic/icons/duotone/Navigation/Close.svg?react';
import axios from '@/utils/axios';
import compareFields from '@rival/club.backend/src/utils/compareFields';
import style from './style.module.scss';

type JustFormProps = {
    formikProps: object;
    tournament: object;
};

const JustForm = (props: JustFormProps) => {
    const { formikProps, tournament } = props;
    const { isSubmitting, values, setFieldValue } = formikProps;

    const challenger = tournament.players[values.challengerId];

    const players = useMemo(() => {
        return Object.values(tournament.players)
            .sort(compareFields('firstName', 'lastName'))
            .filter((item) => item.isActive && item.id !== values.challengerId)
            .map((item) => ({
                value: item.id,
                label: `${item.firstName} ${item.lastName}`,
            }));
    }, [tournament.players, values.challengerId]);

    const getPlayerPicker = (name) => () => {
        if (!values[name]) {
            return;
        }

        ['challenger2Id', 'acceptorId', 'acceptor2Id'].forEach((field) => {
            if (field === name) {
                return;
            }

            if (values[field] === values[name]) {
                setFieldValue(field, 0);
            }
        });
    };
    useEffect(getPlayerPicker('challenger2Id'), [values.challenger2Id]);
    useEffect(getPlayerPicker('acceptorId'), [values.acceptorId]);
    useEffect(getPlayerPicker('acceptor2Id'), [values.acceptor2Id]);

    const sundayInAWeek = dayjs.tz().add(1, 'week').isoWeekday(7).hour(12).minute(0).second(0);
    const endOfTournament = dayjs.tz(tournament.endDate).subtract(12, 'hour');
    const breakEnd = tournament.breakEnd
        ? dayjs.tz(tournament.breakEnd).subtract(12, 'hour')
        : dayjs.tz().add(1, 'year');

    const renderSlot = (name, label) => {
        if (values[name]) {
            return (
                <div>
                    <PlayerName player1={tournament.players[values[name]]} isShort />
                    <span
                        className={style.close + ' svg-icon svg-icon-3 svg-icon-danger'}
                        onClick={() => {
                            setFieldValue(name, 0);
                        }}
                    >
                        <CloseIcon />
                    </span>
                </div>
            );
        }

        return (
            <div className={style.picker}>
                <select className={style.placeholder + ' form-select form-select-solid'}>
                    <option>Pick {label}</option>
                </select>
                <select
                    className={style.select + ' form-select form-select-solid'}
                    onChange={(event) => setFieldValue(name, Number(event.target.value))}
                    {...{ [`data-${name.toLowerCase()}`]: true }}
                >
                    <option value={0}>Pick {label}</option>
                    {players.map((player) => (
                        <option key={player.value} value={player.value}>
                            {player.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <Form noValidate>
            <DateTimeWithWeather
                minDate={dayjs.tz().hour(12).minute(0).second(0)}
                maxDate={
                    tournament.isBreak ? dayjs.min(sundayInAWeek, breakEnd) : dayjs.min(sundayInAWeek, endOfTournament)
                }
            />
            <Field name="place" label="Location" component={Input} />
            <Field
                name="comment"
                label="Comment"
                description="Flexibility, address, court fees, etc."
                component={Input}
            />

            <div className="mb-6">
                <label className="form-label">Players</label>
                <div className={style.description}>
                    Only add people who already agreed to play at this location and time.
                </div>
                <div className={style.team}>
                    <PlayerAvatar
                        player1={challenger}
                        player2={tournament.players[values.challenger2Id] || {}}
                        className="me-2"
                    />
                    <PlayerName player1={challenger} isShort />
                    <div className={style.separator}>/</div>
                    {renderSlot('challenger2Id', 'Partner')}
                </div>
                <div className={style.team}>
                    <PlayerAvatar
                        player1={tournament.players[values.acceptorId] || {}}
                        player2={tournament.players[values.acceptor2Id] || {}}
                        className="me-2"
                    />
                    {renderSlot('acceptorId', 'Opponent 1')}
                    <div className={style.separator}>/</div>
                    {renderSlot('acceptor2Id', 'Opponent 2')}
                </div>
            </div>

            <Button isSubmitting={isSubmitting}>Propose match</Button>
        </Form>
    );
};

type FormDoublesProposalProps = {
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
    tournament: object;
};

const FormDoublesProposal = (props: FormDoublesProposalProps) => {
    const [confirmed, setConfirmed] = useState(false);
    const { initialValues, onSubmit, tournament } = props;
    const currentUser = useSelector((state) => state.auth.user);

    const challengerId = currentUser.tournaments[tournament.id].playerId;

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
        await axios.put('/api/proposals/0', { action: 'addDoublesProposal', ...values });
        await onSubmit();

        notification({
            header: 'Success',
            message: 'Your proposal has been added.',
        });
    };

    return (
        <Formik
            initialValues={{
                place: '',
                comment: '',
                playedAt: '',
                tournaments: [tournament.id],
                challengerId,
                challenger2Id: 0,
                acceptorId: 0,
                acceptor2Id: 0,
                ...initialValues,
            }}
            onSubmit={handleSubmit}
        >
            {(formikProps) => <JustForm formikProps={formikProps} tournament={tournament} />}
        </Formik>
    );
};

export default FormDoublesProposal;
