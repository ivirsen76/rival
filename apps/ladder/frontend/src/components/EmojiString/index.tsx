import { useMemo } from 'react';
import PropTypes from 'prop-types';
import emojiRegex from 'emoji-regex-xs';
import style from './style.module.scss';

const EmojiString = props => {
    const { str } = props;

    const html = useMemo(() => {
        const regex = emojiRegex();
        return str.replace(regex, match => `<span class="${style.emoji}">${match}</span>`);
    }, [str]);

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

EmojiString.propTypes = {
    str: PropTypes.string,
};

export default EmojiString;
