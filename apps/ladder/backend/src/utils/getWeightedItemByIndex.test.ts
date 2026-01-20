import getWeightedItemByIndex from './getWeightedItemByIndex';

describe('getWeightedItemByIndex()', () => {
    const arr = [{ id: 1, weight: 1 }, { id: 2 }, { id: 3, weight: 2 }, { id: 4, weight: 2 }];

    it('Should right values', () => {
        expect(getWeightedItemByIndex(arr, 0).id).toBe(1);
        expect(getWeightedItemByIndex(arr, 1).id).toBe(2);
        expect(getWeightedItemByIndex(arr, 2).id).toBe(3);
        expect(getWeightedItemByIndex(arr, 3).id).toBe(3);
        expect(getWeightedItemByIndex(arr, 4).id).toBe(4);
        expect(getWeightedItemByIndex(arr, 5).id).toBe(4);
        expect(getWeightedItemByIndex(arr, 7).id).toBe(2);
        expect(getWeightedItemByIndex(arr, 19).id).toBe(2);
    });
});
