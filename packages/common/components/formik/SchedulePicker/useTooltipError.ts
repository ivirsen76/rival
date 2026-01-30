import { useState, useEffect } from 'react';

export default (duration = 3000) => {
    const [visible, setVisible] = useState(false);
    const [content, setContent] = useState(null);

    const show = (message) => {
        setContent(message);
        setVisible(true);
    };

    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(t);
    }, [visible, duration]);

    return { visible, show, content };
};
