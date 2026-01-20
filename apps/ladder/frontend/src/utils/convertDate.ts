export default str => {
    if (!str || !/^\d\d?\/\d\d?\/(\d\d|\d\d\d\d)$/.test(str)) {
        return str;
    }

    let [mm, dd, yyyy] = str.split('/');
    mm = mm.padStart(2, '0');
    dd = dd.padStart(2, '0');

    if (yyyy.length === 2) {
        const year = 2000 + Number(yyyy);
        const currentYear = new Date().getFullYear();

        yyyy = (year < currentYear ? '20' : '19') + yyyy;
    }

    return [yyyy, mm, dd].join('-');
};
