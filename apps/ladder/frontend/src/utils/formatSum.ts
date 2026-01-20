export default sum => {
    const dollars = (sum === 0 ? 0 : sum) / 100;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(dollars);
};
