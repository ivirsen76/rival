import finalMatch from './finalMatch';

describe('Templates test', () => {
    const config = {
        city: 'Cary',
        state: 'NC',
    };

    describe('finalMatch', () => {
        const params = {
            seasonEndDate: '2022-11-28 00:00:00',
            fakeCurrentDate: '2022-11-28 12:00:00',
            finalSpot: 7,
            opponent: {
                firstName: 'Paul',
                lastName: 'Pusher',
                email: 'paul@pusher.com',
                phone: '919-123-4567',
            },
            seasonName: '2022 Fall',
            levelName: 'Men 4.0',
            img: { width: 200, height: 50 },
            roundsTotal: 3,
        };

        it('Should return text for quarterfinal', () => {
            const text = finalMatch(config, { ...params, finalSpot: 7 });
            expect(text).toContain('2022 Fall Men 4.0');
            expect(text).toContain('Congrats on making the Final Tournament');
            expect(text).toContain('Saturday, December 3');
            expect(text).toContain('For your Quarterfinal match');
            expect(text).toContain('You must complete your Quarterfinal match by the <b>end of the day on Saturday');
            expect(text).toContain('to be eligible for the next round of the tournament');
            expect(text).not.toContain('opponent has changed');
        });

        it('Should return text for semifinal', () => {
            const text = finalMatch(config, { ...params, finalSpot: 3 });
            expect(text).toContain('Your Semifinal opponent is ready and waiting!');
            expect(text).toContain('Friday, December 9');
            expect(text).toContain('For your Semifinal match');
            expect(text).toContain('You must complete your Semifinal match by the <b>end of the day on Friday');
            expect(text).toContain('to be eligible for the Final round of the tournament');
        });

        it('Should return text for the final', () => {
            const text = finalMatch(config, { ...params, finalSpot: 1 });
            expect(text).toContain('You are now in the Finals!');
            expect(text).toContain('Sunday, December 11');
            expect(text).toContain('For your Final match');
            expect(text).toContain('You must complete your Final match by the <b>end of the day on Sunday');
            expect(text).toContain('we can start giving out');
        });

        it('Should see that opponent has changed', () => {
            const text = finalMatch(config, { ...params, finalSpot: 7, showNewOpponentWarning: true });
            expect(text).toContain('Your Quarterfinal opponent has changed!');
            expect(text).not.toContain('Congrats on making the Final Tournament');
        });
    });
});
