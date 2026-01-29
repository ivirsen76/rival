import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import Select from '@/components/formik/Select';
import DatePicker from '@/components/formik/DatePicker';
import CheckboxArray from '@/components/formik/CheckboxArray';
import Button from '@rival/packages/components/Button';
import dayjs from '@/utils/dayjs';
import { SEASON_OPTIONS } from '@rival/ladder.backend/src/constants';
import useSettings from '@/utils/useSettings';
import { useQuery } from 'react-query';
import axios from '@/utils/axios';

const currentYear = Number(dayjs.tz().format('YYYY'));

type SeasonFormProps = {
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
    isCurrentSeason: boolean;
};

const SeasonForm = (props: SeasonFormProps) => {
    const { initialValues, onSubmit, isCurrentSeason } = props;
    const { settings } = useSettings();
    const { levels } = settings;

    const { data: playingLevels } = useQuery(
        `getLevelsInfoForSeason${initialValues.id}`,
        async () => {
            if (!initialValues.id) {
                return [];
            }

            const response = await axios.put(`/api/seasons/${initialValues.id}`, { action: 'getLevelsInfo' });
            return response.data.data;
        },
        { placeholderData: {} }
    );

    const levelOptions = levels.map((level) => ({
        value: level.id,
        label: (
            <span>
                {level.name}
                {playingLevels[level.id] && (
                    <span className="ms-2 text-black-50">({playingLevels[level.id].count} players)</span>
                )}
            </span>
        ),
        disabled: level.id in playingLevels,
    }));

    const getEndDateInfo = (values) => {
        if (!values.startDate || !values.weeks) {
            return null;
        }

        const result = dayjs.tz(values.startDate).add(values.weeks, 'week').subtract(12, 'hour').format('ll');
        return (
            <div className="mb-5">
                The season will end on <strong>{result}</strong>
            </div>
        );
    };

    return (
        <Formik
            initialValues={{
                weeks: 9,
                year: currentYear,
                season: '',
                levels: [],
                startDate: '',
                ...initialValues,
            }}
            onSubmit={onSubmit}
        >
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    <div className="row">
                        <div className="col">
                            <Field
                                name="year"
                                label="Year"
                                type="number"
                                min={currentYear}
                                max={currentYear + 1}
                                component={Input}
                                disabled={isCurrentSeason}
                            />
                        </div>
                        <div className="col">
                            <Field
                                name="season"
                                label="Season"
                                options={[{ value: '', label: '-- Select a season --' }, ...SEASON_OPTIONS]}
                                component={Select}
                                disabled={isCurrentSeason}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <Field
                                name="startDate"
                                label="Start date"
                                placeholder="Select a date"
                                component={DatePicker}
                                disabled={isCurrentSeason}
                            />
                        </div>
                        <div className="col">
                            <Field
                                name="weeks"
                                label="Duration in weeks"
                                component={Input}
                                type="number"
                                max={20}
                                min={1}
                            />
                        </div>
                    </div>

                    {getEndDateInfo(values)}

                    <Field name="levels" label="Levels" component={CheckboxArray} options={levelOptions} />

                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default SeasonForm;
