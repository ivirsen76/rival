type Item = { weight?: number; [key: string]: unknown };

const getWeightedItemByIndex = (arr: Item[], index: number) => {
    // Calculate total weight
    const totalWeight = arr.reduce((sum, item) => sum + (item.weight || 1), 0);

    // Normalize index to a range [0, totalWeight)
    const target = ((index % totalWeight) + totalWeight) % totalWeight;

    // Walk through arr until we reach the target
    let cumulative = 0;
    for (const item of arr) {
        cumulative += item.weight || 1;
        if (target < cumulative) {
            return item;
        }
    }

    return arr[arr.length - 1];
};

export default getWeightedItemByIndex;
