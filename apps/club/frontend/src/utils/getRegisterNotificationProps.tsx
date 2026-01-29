import dayjs from '@/utils/dayjs';

// get notification props after successful registration in the ladder
export default ({ message, buttonTitle = 'Go to the Ladder', ladderUrl, season }) => {
    const currentDate = dayjs.tz();
    const startDate = season?.startDate ? dayjs.tz(season.startDate) : null;
    const isFutureSeason = startDate && startDate.isAfter(currentDate);

    return {
        message: (
            <>
                <p>{message}</p>
                {isFutureSeason && (
                    <p>
                        The ladder officially begins on {startDate.format('MMMM D')}. On that date, you can start
                        proposing matches and playing for points. We will send you a reminder when the day comes. See
                        you on the courts!
                    </p>
                )}
            </>
        ),
        buttonTitle,
        onHide: () => window.tl.history.push(ladderUrl),
    };
};
