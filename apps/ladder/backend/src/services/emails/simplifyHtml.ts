export default (html: string) => {
    return html
        .replace(/<strong>/g, '<b>')
        .replace(/<\/strong>/g, '</b>')
        .replace(/<em>/g, '<i>')
        .replace(/<\/em>/g, '</i>');
};
