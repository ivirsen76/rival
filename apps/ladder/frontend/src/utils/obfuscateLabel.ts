// will include some invisible character that the browser cannot read it
// Use for address fields and labels just to not show address autocomplete
export default text => {
    return text.split('').join('\u200B'); // zero-width space
};
