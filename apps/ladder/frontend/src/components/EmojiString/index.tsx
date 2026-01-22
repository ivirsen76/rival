import { useMemo } from 'react';
import emojiRegex from 'emoji-regex-xs';
import style from './style.module.scss';

type EmojiStringProps = {
    str: string;
};

const EmojiString = (props: EmojiStringProps) => {
    const { str } = props;

    const html = useMemo(() => {
        const regex = emojiRegex();
        return str.replace(regex, (match) => `<span class="${style.emoji}">${match}</span>`);
    }, [str]);

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default EmojiString;
