// precache data for the ELO calculation
import { calculateElo } from './services/matches/calculateElo';

export default () => {
    calculateElo();
};
