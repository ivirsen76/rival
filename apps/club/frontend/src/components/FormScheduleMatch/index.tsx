import { Formik, Field, Form } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Button from '@rival/common/components/Button';
import DateTimeWithWeather from '@rival/common/components/DateTimeWithWeather';
import dayjs from '@rival/common/dayjs';
import axios from '@rival/common/axios';

type FormScheduleMatchProps = {
    match: object;
    tournament: object;
    onSubmit: (...args: unknown[]) => unknown;
};

const FormScheduleMatch = (props: FormScheduleMatchProps) => {
    const { match, tournament, onSubmit } = props;
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
