export default html => {
    return html
        .replace(/<strong>/g, '<b>')
        .replace(/<\/strong>/g, '</b>')
        .replace(/<em>/g, '<i>')
        .replace(/<\/em>/g, '</i>');
};
