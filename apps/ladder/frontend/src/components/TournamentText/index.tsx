import Html from '@/components/Html';
import Timeline from './Timeline';
import dayjs from '@/utils/dayjs';

const applyVariables = (tournamentEndDate, text) => {
    const endDate = dayjs.tz(tournamentEndDate).add(12, 'hour');
    const nextMonday = endDate.add(1, 'week');
    const format = (date) => dayjs.tz(date).format('MMMM D');

    const variables = {
        // last season Sunday
        $sunday0: format(endDate.subtract(1, 'day').isoWeekday(7)),

        // first week
        $monday1: format(endDate.isoWeekday(1)),
        $tuesday1: format(endDate.isoWeekday(2)),
        $wednesday1: format(endDate.isoWeekday(3)),
        $thursday1: format(endDate.isoWeekday(4)),
        $friday1: format(endDate.isoWeekday(5)),
        $saturday1: format(endDate.isoWeekday(6)),
        $sunday1: format(endDate.isoWeekday(7)),

        // second week
        $monday2: format(nextMonday.isoWeekday(1)),
        $tuesday2: format(nextMonday.isoWeekday(2)),
        $wednesday2: format(nextMonday.isoWeekday(3)),
        $thursday2: format(nextMonday.isoWeekday(4)),
        $friday2: format(nextMonday.isoWeekday(5)),
        $saturday2: format(nextMonday.isoWeekday(6)),
        $sunday2: format(nextMonday.isoWeekday(7)),
    };

    let adjustedText = text;
    for (const [key, value] of Object.entries(variables)) {
        adjustedText = adjustedText.replaceAll(key, value);
    }

    return adjustedText;
};

type TournamentTextProps = {
    text: React.ReactNode;
    tournament: object;
};

const TournamentText = (props: TournamentTextProps) => {
    const { tournament } = props;
    const adjustedText = applyVariables(tournament.endDate, props.text);

    return (
        <div>
            <Html content={adjustedText} />
            {tournament.levelType === 'single' && (
                <div className="mt-4">
                    <Timeline tournament={tournament} />
                </div>
            )}
        </div>
    );
};

export default TournamentText;
