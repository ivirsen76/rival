import getSeasonSvg, { getLevelList } from './getSeasonSvg';
import _cloneDeep from 'lodash/cloneDeep';
import { XMLValidator } from 'fast-xml-parser';

describe('getSeasonSvg()', () => {
    const expectBlocks = (svg, blocks) => {
        // check for svg validity
        const result = XMLValidator.validate(svg);
        expect(result).toBe(true);

        const items = svg.match(/data-(title|description)="([^"]+)"/g);

        const expectedBlocks = items
            .reduce((arr, item) => {
                let prevElement = arr[arr.length - 1];

                const isTitle = item.includes('data-title');
                const title = item.slice(12, -1);
                const description = item.slice(18, -1);

                if (isTitle && prevElement?.title !== title) {
                    prevElement = { title, description: [] };
                    arr.push(prevElement);
                }

                if (!isTitle && prevElement) {
                    prevElement.description.push(description);
                }

                return arr;
            }, [])
            .map(item => ({ title: item.title, description: item.description.join(' | ') }));

        expect(blocks).toEqual(expectedBlocks);
    };

    const params = {
        season: {
            name: '2025 Winter',
            startDate: '2025-12-08 00:00:00',
            dates: 'Dec 8 - Mar 1',
            weeks: 10,
            isFree: 0,
        },
        levels: [
            {
                tournamentId: 1,
                levelId: 1,
                levelName: "Men's 2.5 Singles",
                levelType: 'single',
                levelBaseTlr: 250,
                levelMinTlr: 200,
                levelMaxTlr: 300,
                isActivePlay: false,
                gender: 'male',
            },
            {
                tournamentId: 2,
                levelId: 2,
                levelName: "Men's 3.0 Singles",
                levelType: 'single',
                levelBaseTlr: 300,
                levelMinTlr: 250,
                levelMaxTlr: 350,
                isActivePlay: true,
                gender: 'male',
            },
            {
                tournamentId: 3,
                levelId: 3,
                levelName: "Men's 3.5 Singles",
                levelType: 'single',
                levelBaseTlr: 350,
                levelMinTlr: 300,
                levelMaxTlr: 400,
                isActivePlay: true,
                gender: 'male',
            },
            {
                tournamentId: 4,
                levelId: 4,
                levelName: "Men's 4.0 Singles",
                levelType: 'single',
                levelBaseTlr: 400,
                levelMinTlr: 350,
                levelMaxTlr: 450,
                isActivePlay: true,
                gender: 'male',
            },
            {
                tournamentId: 5,
                levelId: 5,
                levelName: "Men's 4.5 Singles",
                levelType: 'single',
                levelBaseTlr: 450,
                levelMinTlr: 400,
                levelMaxTlr: 500,
                isActivePlay: true,
                gender: 'male',
            },
            {
                tournamentId: 6,
                levelId: 6,
                levelName: "Men's 5.0+ Singles",
                levelType: 'single',
                levelBaseTlr: 500,
                levelMinTlr: 450,
                levelMaxTlr: 700,
                isActivePlay: false,
                gender: 'male',
            },
            {
                tournamentId: 7,
                levelId: 7,
                levelName: "Women's 2.0 Singles",
                levelType: 'single',
                levelBaseTlr: 200,
                levelMinTlr: 150,
                levelMaxTlr: 250,
                isActivePlay: false,
                gender: 'female',
            },
            {
                tournamentId: 8,
                levelId: 8,
                levelName: "Women's 2.5 Singles",
                levelType: 'single',
                levelBaseTlr: 250,
                levelMinTlr: 200,
                levelMaxTlr: 300,
                isActivePlay: true,
                gender: 'female',
            },
            {
                tournamentId: 9,
                levelId: 9,
                levelName: "Women's 3.0 Singles",
                levelType: 'single',
                levelBaseTlr: 300,
                levelMinTlr: 250,
                levelMaxTlr: 350,
                isActivePlay: true,
                gender: 'female',
            },
            {
                tournamentId: 10,
                levelId: 10,
                levelName: "Women's 3.5 Singles",
                levelType: 'single',
                levelBaseTlr: 350,
                levelMinTlr: 300,
                levelMaxTlr: 400,
                isActivePlay: true,
                gender: 'female',
            },
            {
                tournamentId: 11,
                levelId: 11,
                levelName: "Women's 4.0 Singles",
                levelType: 'single',
                levelBaseTlr: 400,
                levelMinTlr: 350,
                levelMaxTlr: 500,
                isActivePlay: false,
                gender: 'female',
            },
            {
                tournamentId: 12,
                levelId: 12,
                levelName: "Men's 3.5/4.0 DBLS",
                levelType: 'doubles-team',
                levelBaseTlr: 375,
                levelMinTlr: 250,
                levelMaxTlr: 500,
                isActivePlay: true,
                gender: 'male',
            },
            {
                tournamentId: 13,
                levelId: 13,
                levelName: "Women's 2.0/2.5 DBLS",
                levelType: 'doubles-team',
                levelBaseTlr: 225,
                levelMinTlr: 150,
                levelMaxTlr: 300,
                isActivePlay: true,
                gender: 'female',
            },
            {
                tournamentId: 14,
                levelId: 14,
                levelName: "Women's 3.0/3.5 DBLS",
                levelType: 'doubles-team',
                levelBaseTlr: 325,
                levelMinTlr: 250,
                levelMaxTlr: 400,
                isActivePlay: true,
                gender: 'female',
            },
        ],
        config: {
            singlesCost: 3500,
            doublesCost: 2500,
            additionalLadderDiscount: 1000,
            earlyRegistrationDiscount: 500,
            singlesChampionReward: 5000,
            singlesRunnerUpReward: 2500,
            minMatchesToPay: 3,
        },
        currentDate: '2025-11-01 00:00:00',
        scale: 1,
        totalPlayers: 99,
        creditAmount: 500,
        elo: 297,
        matchesPlayed: 13,
        gender: 'male',
    };
    const totalPlayersText = 'players already joined';

    it('Should return right svg', () => {
        const svg = getSeasonSvg(params);

        expect(svg).toContain('2025 Winter');
        expect(svg).not.toContain(totalPlayersText);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Cost', description: 'Before the season begins: | $30 Singles | $20 Doubles' },
            { title: '$5 Credit', description: 'Available for payment' },
            { title: 'TLR 2.97', description: 'You current rating' },
            { title: 'Ladders for You', description: "Men's 2.5 Singles | Men's 3.0 Singles | Men's 3.5/4.0 DBLS" },
        ]);
    });

    it('Should contain joined players text', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.totalPlayers = 100;

        const svg = getSeasonSvg(adjustedParams);
        expect(svg).toContain('100 ' + totalPlayersText);
    });

    it('Should return right svg for free season and no tlr', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.season.isFree = 1;
        adjustedParams.elo = null;

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$25 for Champion' },
            { title: 'Free to Join', description: 'All fun, no fees' },
            { title: 'Ladders', description: "Men's 2.5-5.0 | Women's 2.0-4.0 | Men's and Women's Doubles" },
        ]);
    });

    it('Should return right svg for few matches and no tlr', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.matchesPlayed = 2;
        adjustedParams.elo = null;

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Free for You', description: 'Join anytime' },
            { title: 'Ladders', description: "Men's 2.5-5.0 | Women's 2.0-4.0 | Men's and Women's Doubles" },
        ]);
    });

    it('Should return right svg for free season', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.season.isFree = 1;

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$25 for Champion' },
            { title: 'Free to Join', description: 'All fun, no fees' },
            { title: 'TLR 2.97', description: 'You current rating' },
            { title: 'Ladders for You', description: "Men's 2.5 Singles | Men's 3.0 Singles | Men's 3.5/4.0 DBLS" },
        ]);
    });

    it('Should return right svg for season already started', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.currentDate = '2025-12-25 00:00:00';

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Cost', description: 'After the season begins: | $35 Singles | $25 Doubles' },
            { title: '$5 Credit', description: 'Available for payment' },
            { title: 'TLR 2.97', description: 'You current rating' },
            { title: 'Ladders for You', description: "Men's 2.5 Singles | Men's 3.0 Singles | Men's 3.5/4.0 DBLS" },
        ]);
    });

    it('Should return right svg for no credit', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.creditAmount = 0;

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Cost', description: 'Before the season begins: | $30 Singles | $20 Doubles' },
            { title: '$10 Discount', description: 'For additional ladder' },
            { title: 'TLR 2.97', description: 'You current rating' },
            { title: 'Ladders for You', description: "Men's 2.5 Singles | Men's 3.0 Singles | Men's 3.5/4.0 DBLS" },
        ]);
    });

    it('Should return proper levels for woman', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.gender = 'female';

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Cost', description: 'Before the season begins: | $30 Singles | $20 Doubles' },
            { title: '$5 Credit', description: 'Available for payment' },
            { title: 'TLR 2.97', description: 'You current rating' },
            {
                title: 'Ladders for You',
                description: "Women's 2.5 Singles | Women's 3.0 Singles | Women's 2.0/2.5 DBLS",
            },
        ]);
    });

    it('Should return proper levels for woman with really low TLR', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.gender = 'female';
        adjustedParams.elo = 145;

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Cost', description: 'Before the season begins: | $30 Singles | $20 Doubles' },
            { title: '$5 Credit', description: 'Available for payment' },
            { title: 'TLR 1.45', description: 'You current rating' },
            {
                title: 'Ladders for You',
                description: "Women's 2.0 Singles | Women's 2.5 Singles",
            },
        ]);
    });

    it('Should return proper levels for woman with low TLR', () => {
        const adjustedParams = _cloneDeep(params);
        adjustedParams.gender = 'female';
        adjustedParams.elo = 155;

        const svg = getSeasonSvg(adjustedParams);

        expectBlocks(svg, [
            { title: 'Dec 8 - Mar 1', description: '10 weeks' },
            { title: 'Prizes', description: '$50 for Champion | $25 for Runner-Up' },
            { title: 'Cost', description: 'Before the season begins: | $30 Singles | $20 Doubles' },
            { title: '$5 Credit', description: 'Available for payment' },
            { title: 'TLR 1.55', description: 'You current rating' },
            {
                title: 'Ladders for You',
                description: "Women's 2.0 Singles | Women's 2.5 Singles | Women's 2.0/2.5 DBLS",
            },
        ]);
    });
});

describe('getLevelList', () => {
    const levels = [
        { levelName: "Men's 3.5 Singles", levelType: 'single' },
        { levelName: "Men's 4.0", levelType: 'single' },
        { levelName: "Men's 4.5 Singles", levelType: 'single' },
        { levelName: "Women's 4.0", levelType: 'single' },
        { levelName: "Women's 4.5", levelType: 'single' },
        { levelName: "Men's 3.0/3.5 DBLS", levelType: 'doubles-team' },
        { levelName: "Women's 4.0/4.5 Doubles", levelType: 'doubles-team' },
        { levelName: "Men's Team Doubles", levelType: 'doubles-team' },
        { levelName: "Women's 4.5", levelType: 'single' },
        { levelName: "Men's 5.0+", levelType: 'single' },
    ];

    it('Should return all available levels', () => {
        expect(getLevelList(levels)).toEqual(["Men's 3.5-5.0", "Women's 4.0-4.5", "Men's and Women's Doubles"]);
    });

    it('Should return empty string', () => {
        expect(getLevelList([])).toEqual([]);
    });
});
