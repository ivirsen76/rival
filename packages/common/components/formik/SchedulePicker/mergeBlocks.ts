export default (blocks, maxGap = 2) => {
    if (!blocks.length) return [];

    // Normalize and sort
    blocks = blocks.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]).sort((a, b) => a[0] - b[0]);

    const merged = [];
    let [start, end] = blocks[0];

    for (let i = 1; i < blocks.length; i++) {
        const [nextStart, nextEnd] = blocks[i];

        // Overlap OR gap < maxGap
        if (nextStart - end < maxGap) {
            end = Math.max(end, nextEnd);
        } else {
            merged.push([start, end]);
            [start, end] = [nextStart, nextEnd];
        }
    }

    merged.push([start, end]);
    return merged;
};
