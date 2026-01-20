import _cloneDeep from 'lodash/cloneDeep';

function benchmark(fnA, fnB, iterations = 1000) {
    const now = typeof performance !== 'undefined' && performance.now ? () => performance.now() : () => Date.now();

    // Warm-up (important for JIT optimization)
    for (let i = 0; i < 100; i++) {
        fnA();
        fnB();
    }

    let start = now();
    for (let i = 0; i < iterations; i++) fnA();
    const timeA = now() - start;

    start = now();
    for (let i = 0; i < iterations; i++) fnB();
    const timeB = now() - start;

    console.info({
        iterations,
        fnA: {
            totalMs: timeA,
            avgMs: timeA / iterations,
        },
        fnB: {
            totalMs: timeB,
            avgMs: timeB / iterations,
        },
        faster: timeA < timeB ? 'fnA' : timeB < timeA ? 'fnB' : 'equal',
        times: timeA < timeB ? timeB / timeA : timeA / timeB,
    });
}

const initialLevelSettings = {
    maxPoints: 0,
    tournamentResult: null,
    minFinalSpot: 99,
    seasonPoints: {},
};

benchmark(
    () => {
        return { ..._cloneDeep(initialLevelSettings) };
    },
    () => {
        return {
            maxPoints: 0,
            tournamentResult: null,
            minFinalSpot: 99,
            seasonPoints: {},
        };
    },
    100000
);
