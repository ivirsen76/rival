import { useState } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Button from '@/components/Button';
import DateTimeWithWeather from '@/components/DateTimeWithWeather';
import dayjs from '@/utils/dayjs';
import axios from '@/utils/axios';
import useConfig from '@/utils/useConfig';
import style from './style.module.scss';

type FormScheduleMatchProps = {
    match: object;
    tournament: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const FormScheduleMatch = (props: FormScheduleMatchProps) => {
    const { match, tournament, onSubmit } = props;
    const config = useConfig();
    const [step, setStep] = useState(() => {
        if (match.type !== 'final' || match.playedAt || !config.isRaleigh) {
            return 'form';
        }

        return 'choice';
    });
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const maxDate = (() => {
        const sundayNextWeek = dayjs.tz().isoWeekday(7).hour(12).minute(0).second(0).add(1, 'week');
        if (match.type === 'final' || !tournament) {
            return sundayNextWeek;
        }

        const endOfTournament = dayjs.tz(tournament.endDate).subtract(12, 'hour');
        return dayjs.min(sundayNextWeek, endOfTournament);
    })();

    const handleSubmit = async (values) => {
        await axios.put(`/api/matches/${match.id}`, { action: 'scheduleMatch', ...values });
        await onSubmit(values);
    };

    if (step === 'choice') {
        return (
            <div className={style.buttons}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep('form')}>
                    We have a court to play
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setStep('instructions')}>
                    We need to reserve a court
                </button>
            </div>
        );
    }

    if (step === 'instructions') {
        return (
            <div>
                <p>
                    If you require a court reservation, you can fill out the{' '}
                    <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSe6y12_k4l5Xjg5D4oscza7a8X0jlPXyHOv6oJYmT-XQ6CC_Q/viewform?embedded=true"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Tennis Court Reservation Form
                    </a>{' '}
                    to receive a free court for your tournament match.
                </p>
                <p>
                    Be sure to put &quot;ladder tournament match&quot; in the Comment/Questions section to avoid being
                    charged the normal rate of $5 per hour per court. If possible, please input your request at least 48
                    hours ahead of your match.
                </p>
                <p>
                    For a Millbrook court, please call our office at <a href="sms:9199964129">919-996-4129</a> or email{' '}
                    <a href="mailto:tenniscourts@raleighnc.gov">tenniscourts@raleighnc.gov</a>.
                </p>
                After confirmation, make sure to fill out your confirmed time and place using the <b>Schedule</b> button
                on your match.
            </div>
        );
    }

    return (
        <Formik
            initialValues={{
                challengerId: match.challengerId,
                acceptorId: match.acceptorId,
                challenger2Id: match.challenger2Id,
                acceptor2Id: match.acceptor2Id,
                place: match.place || '',
                playedAt: match.playedAt || '',
            }}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    {(() => {
                        if (match.type === 'final') {
                            return (
                                <p>
                                    First contact your opponent {isDoublesTeam && 'team '}using their email or phone
                                    number. After you both agree to a date and place, put that information here.
                                </p>
                            );
                        }

                        // if rescheduling a regular match
                        if (match.playedAt) {
                            return (
                                <p>
                                    Both {isDoublesTeam ? 'teams' : 'players'} must agree to reschedule. If one{' '}
                                    {isDoublesTeam ? 'team' : 'player'} reschedules without the other&apos;s permission
                                    within 24 hours, they could be subject to a Default.
                                </p>
                            );
                        }

                        return null;
                    })()}

                    <DateTimeWithWeather minDate={dayjs.tz().hour(12).minute(0).second(0)} maxDate={maxDate} />

                    <Field name="place" label="Location" component={Input} maxLength={40} />
                    <Button isSubmitting={isSubmitting}>
                        {match.playedAt ? 'Reschedule match' : 'Schedule match'}
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormScheduleMatch;
