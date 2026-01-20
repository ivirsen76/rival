import getPointsCalculation from './getPointsCalculation';

describe('getPointsCalculation()', () => {
    it('Should get proper points for score 6-1 6-0 for higher rank', () => {
        const result = getPointsCalculation({
            challengerRank: 3,
            acceptorRank: 4,
            score: '6-1 6-0',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverLower: 10,
            gamesDiff: 11,
            totalGames: 1,
            challengerPoints: 25,
            acceptorPoints: 3,
            challengerFormula:
                '<div>participationBonus + challengerBonus + winOverLower + gamesDiff = </div><div>challengerPoints</div>',
            acceptorFormula: '<div>participationBonus + totalGames = </div><div>acceptorPoints</div>',
        });
    });

    it('Should get proper points for score 6-1 6-0 for lower rank', () => {
        const result = getPointsCalculation({
            challengerRank: 4,
            acceptorRank: 20,
            score: '1-6 7-6 0-6',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverHigher: 15,
            gamesDiff: 10,
            rankDiff: 10,
            isRankDiffMax: true,
            totalGames: 8,
            challengerPoints: 12,
            acceptorPoints: 40,
            challengerFormula:
                '<div>participationBonus + challengerBonus + totalGames = </div><div>challengerPoints</div>',
            acceptorFormula:
                '<div>participationBonus + winOverHigher + (rankDiff * gamesDiff / 2) = 67 → </div><div>acceptorPoints</div>',
        });
    });

    it('Should get proper points for score 6-1 6-0 for equal rank', () => {
        const result = getPointsCalculation({
            challengerRank: 3,
            acceptorRank: 3,
            score: '6-1 6-0',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverEqual: 15,
            gamesDiff: 11,
            totalGames: 1,
            challengerPoints: 30,
            acceptorPoints: 3,
            challengerFormula:
                '<div>participationBonus + challengerBonus + winOverEqual + gamesDiff = </div><div>challengerPoints</div>',
            acceptorFormula: '<div>participationBonus + totalGames = </div><div>acceptorPoints</div>',
        });
    });

    it('Should get proper points for looser winning more than 10 games', () => {
        const result = getPointsCalculation({
            challengerRank: 14,
            acceptorRank: 15,
            score: '6-7 7-6 6-7',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverHigher: 15,
            gamesDiff: 2,
            rankDiff: 2,
            isRankDiffMin: true,
            isGamesDiffMin: true,
            totalGames: 10,
            isTotalGamesMax: true,
            challengerPoints: 14,
            acceptorPoints: 19,
            challengerFormula:
                '<div>participationBonus + challengerBonus + totalGames = </div><div>challengerPoints</div>',
            acceptorFormula:
                '<div>participationBonus + winOverHigher + (rankDiff * gamesDiff / 2) = </div><div>acceptorPoints</div>',
        });
    });

    it('Should get proper points for winning in three sets', () => {
        const result = getPointsCalculation({
            challengerRank: 14,
            acceptorRank: 1,
            score: '6-1 3-6 6-4',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverHigher: 15,
            gamesDiff: 4,
            rankDiff: 10,
            isRankDiffMax: true,
            totalGames: 10,
            isTotalGamesMax: true,
            challengerPoints: 39,
            acceptorPoints: 12,
            challengerFormula:
                '<div>participationBonus + challengerBonus + winOverHigher + (rankDiff * gamesDiff / 2) = </div><div>challengerPoints</div>',
            acceptorFormula: '<div>participationBonus + totalGames = </div><div>acceptorPoints</div>',
        });
    });

    it('Should get proper points for winning not whole number of points', () => {
        const result = getPointsCalculation({
            challengerRank: 20,
            acceptorRank: 11,
            score: '6-0 6-1',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverHigher: 15,
            gamesDiff: 11,
            rankDiff: 9,
            totalGames: 1,
            challengerPoints: 40,
            acceptorPoints: 3,
            challengerFormula:
                '<div>participationBonus + challengerBonus + winOverHigher + (rankDiff * gamesDiff / 2) = 68.5 → </div><div>challengerPoints</div>',
            acceptorFormula: '<div>participationBonus + totalGames = </div><div>acceptorPoints</div>',
        });
    });

    it('Should round points', () => {
        const result = getPointsCalculation({
            challengerRank: 20,
            acceptorRank: 11,
            score: '6-4 7-6',
        });

        expect(result).toEqual({
            participationBonus: 2,
            challengerBonus: 2,
            winOverHigher: 15,
            gamesDiff: 3,
            rankDiff: 9,
            totalGames: 10,
            challengerPoints: 32,
            acceptorPoints: 12,
            challengerFormula:
                '<div>participationBonus + challengerBonus + winOverHigher + (rankDiff * gamesDiff / 2) = 32.5 → </div><div>challengerPoints</div>',
            acceptorFormula: '<div>participationBonus + totalGames = </div><div>acceptorPoints</div>',
        });
    });
});
