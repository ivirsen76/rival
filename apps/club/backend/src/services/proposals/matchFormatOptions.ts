export default [
    {
        value: 0,
        label: 'Regular',
        description: '10-point tiebreak if players split sets',
    },
    {
        value: 1,
        label: 'Full 3rd set',
        description: 'Full 3rd set if players split sets',
        warning: 'If you split sets (1-1), you must play the full third set. A match may last 2+ hours.',
    },
    {
        value: 2,
        label: 'Fast4',
        description: '4-game sets and 3rd-set tiebreaker',
        rules: [
            'Each set goes to 4 games (7-point tiebreak at 3-3)',
            '10-point tiebreak if players split sets (1-1)',
            'No-Ad scoring. At Deuce (40-40), a single "deciding point" is played. The receiver chooses the side.',
        ],
    },
];
