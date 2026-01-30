import mergeBlocks from './mergeBlocks';

describe('mergeBlocks', () => {
    test('returns empty array for empty input', () => {
        expect(mergeBlocks([])).toEqual([]);
    });

    test('merges overlapping blocks', () => {
        const input = [
            [1, 8],
            [7, 10],
        ];
        expect(mergeBlocks(input)).toEqual([[1, 10]]);
    });

    test('merges blocks with gap less than 2', () => {
        const input = [
            [1, 5],
            [6, 8],
        ]; // gap = 1
        expect(mergeBlocks(input)).toEqual([[1, 8]]);
    });

    test('does not merge blocks with gap equal to 2', () => {
        const input = [
            [1, 5],
            [7, 9],
        ]; // gap = 2
        expect(mergeBlocks(input)).toEqual([
            [1, 5],
            [7, 9],
        ]);
    });

    test('handles unordered blocks', () => {
        const input = [
            [7, 10],
            [1, 8],
        ];
        expect(mergeBlocks(input)).toEqual([[1, 10]]);
    });

    test('handles reversed blocks', () => {
        const input = [
            [8, 1],
            [10, 7],
        ];
        expect(mergeBlocks(input)).toEqual([[1, 10]]);
    });

    test('handles multiple merge groups', () => {
        const input = [
            [1, 8],
            [7, 10],
            [14, 16],
        ];
        expect(mergeBlocks(input)).toEqual([
            [1, 10],
            [14, 16],
        ]);
    });

    test('merges chain of blocks', () => {
        const input = [
            [1, 3],
            [4, 6],
            [7, 9],
        ];
        expect(mergeBlocks(input)).toEqual([[1, 9]]);
    });

    test('respects custom maxGap value', () => {
        const input = [
            [1, 5],
            [8, 10],
        ]; // gap = 3
        expect(mergeBlocks(input, 4)).toEqual([[1, 10]]);
    });

    test('single block returns itself', () => {
        const input = [[3, 7]];
        expect(mergeBlocks(input)).toEqual([[3, 7]]);
    });
});
