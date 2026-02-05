import _omit from 'lodash/omit';
import 'dotenv/config';
import { runQuery } from '../db/connection';

const getCombinedConfig = async () => {
    const [row] = await runQuery('SELECT * FROM config');
    const override = process.env.TL_ENV !== 'production' && row.override ? JSON.parse(row.override) : {};

    const defaultValues = {
        addressZenKey: 'ak_mifh1nvwB0rBCMmlwtjQiTSpBAluu',
        maxAgeCompatibleGap: 15,
        maxCommentsPerDay: 20,
        maxCompetitiveTlrGap: 25,
        maxMessagesPerWeek: 3,
        maxPhotoSize: 20 * 1024 * 1024,
        maxPhotosPerDay: 5,
        maxPlayersPerDoublesTeam: 3,
        minMatchesForActiveLadder: 50,
        minMatchesToAddPhotos: 10,
        minMatchesToEstablishTlr: 10,
        minMatchesToPlanTournament: 20,
        minMatchesToSendMessages: 10,
        minPlayersForActiveLadder: 20,
        minPlayersForPrediction: 8,
        minPlayersToRunTournament: 4,
        photosPerPage: 12,
        proposalEmailWaitTime: 2 * 60 * 1000, // 2 minutes
        registrationAheadWeeks: 3,
        teamNameMaxLength: 16,
        teamNameMinLength: 5,
        timeToViewPhoto: 5000, // 5s
        tournamentReminderWeeks: 1,
    };

    return {
        ..._omit(row, ['override']),
        ...defaultValues,
        ...override,
    };
};

export default getCombinedConfig;
