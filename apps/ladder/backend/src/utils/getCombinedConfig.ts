import mysql from 'mysql';
import _omit from 'lodash/omit';
import 'dotenv/config';

const connectionConfig = {
    host: process.env.TL_DB_HOSTNAME,
    user: process.env.TL_DB_USERNAME,
    password: process.env.TL_DB_PASSWORD,
    database: process.env.TL_DB_NAME,
    dateStrings: true,
};
const connection = mysql.createConnection(connectionConfig);
connection.connect();

const runQuery = async (query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

const getCombinedConfig = async () => {
    const [row] = await runQuery('SELECT * FROM config');
    const override = process.env.TL_ENV !== 'production' && row.override ? JSON.parse(row.override) : {};

    const defaultValues = {
        additionalLadderDiscount: 1000,
        addressZenKey: 'ak_mifh1nvwB0rBCMmlwtjQiTSpBAluu',
        creditRewardBonus: 500,
        doublesChampionReward: 1500,
        doublesCost: 2500,
        earlyRegistrationDiscount: 500,
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
        minMatchesToPay: 3,
        minMatchesToPlanTournament: 20,
        minMatchesToSendMessages: 10,
        minPlayersForActiveLadder: 20,
        minPlayersForPrediction: 8,
        minPlayersToRunTournament: 4,
        photosPerPage: 12,
        proposalEmailWaitTime: 2 * 60 * 1000, // 2 minutes
        referralFirstMatchCredit: 500,
        referralFirstPaymentCredit: 1000,
        registrationAheadWeeks: 3,
        singlesChampionReward: 5000,
        singlesCost: 3500,
        singlesRunnerUpReward: 2500,
        teamNameMaxLength: 16,
        teamNameMinLength: 5,
        timeToViewPhoto: 5000, // 5s
        tooHighTlrDiscount: 1000,
        tournamentReminderWeeks: 1,
    };

    return {
        ..._omit(row, ['override']),
        ...defaultValues,
        ...override,
    };
};

export default getCombinedConfig;
