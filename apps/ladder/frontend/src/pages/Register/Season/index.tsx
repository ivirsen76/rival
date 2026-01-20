import { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';

const SeasonPicker = props => {
    const { settings, updateSettings, onSubmit, seasons } = props;

    useEffect(() => {
        if (seasons.length === 1) {
            updateSettings({ id: seasons[0].id });
            onSubmit();
        } else if (seasons.length > 1) {
            updateSettings({ id: 0 });
        }
    }, [seasons]);

    const seasonOptions = useMemo(() => {
        const currentDate = dayjs.tz();

        return seasons.map(season => {
            const startDate = dayjs.tz(season.startDate);
            const endDate = dayjs.tz(season.endDate).subtract(1, 'minute');
            const time = currentDate.isBefore(season.startDate)
                ? `Starts ${startDate.format('MMMM D')}`
                : `Ends ${endDate.format('MMMM D')}`;

            return {
                ...season,
                time,
            };
        });
    }, [seasons]);

    if (seasons.length < 2) {
        return null;
    }

    return (
        <div>
            <div>
                <label className="form-label">Choose season</label>
            </div>
            <div className="btn-group w-100">
                {seasonOptions.map((season, index) => (
                    <button
                        key={season.id}
                        type="button"
                        className={classnames(style.season, 'p-2', settings.id === season.id && style.active)}
                        onClick={() => {
                            updateSettings({ id: season.id });
                            onSubmit();
                        }}
                    >
                        <div>{index === 0 ? 'Current season' : 'Next season'}</div>
                        <div className={style.name}>{season.name}</div>
                        <div>{season.time}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

SeasonPicker.propTypes = {
    settings: PropTypes.object,
    updateSettings: PropTypes.func,
    onSubmit: PropTypes.func,
    seasons: PropTypes.array,
};

export default SeasonPicker;
