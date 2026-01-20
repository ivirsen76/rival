function toCSVValue(val) {
    if (val == null) return '';

    const v = String(val);
    if (v.includes('"') || v.includes(',') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
    }

    return v;
}

export const toCSV = data => {
    const headers = Object.keys(data[0]);
    const rows = [
        headers.map(toCSVValue).join(','),
        ...data.map(row => headers.map(h => toCSVValue(row[h])).join(',')),
    ];
    return rows.join('\n');
};

export default (data, filename = 'file.csv') => {
    const csv = toCSV(data);

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};
