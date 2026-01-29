import * as ReactDOMServer from 'react-dom/server';
import pieces from '@/components/AvatarBuilder/pieces';
import Avatar from '@rival/packages/components/avataaars';

let counter = 0;

const generateRandom = (gender = 'male') => {
    const total = 15;

    const getRandomItem = (array) => {
        const len = array.reduce((sum, obj) => sum + (obj.rabbitWeight || obj.weight || 1), 0);
        const num = Math.floor(Math.random() * len);
        let count = 0;
        for (const item of array) {
            count += item.rabbitWeight || item.weight || 1;
            if (num < count) {
                return item.value;
            }
        }

        return array[0].value;
    };

    return new Array(total).fill(0).map((_) => {
        const item = {};
        for (const [type, settings] of Object.entries(pieces)) {
            item[type] = getRandomItem(settings.options.filter((option) => !option.gender || option.gender === gender));
        }
        item.id = `${counter++}-${Number(Date.now())}`;
        return item;
    });
};

export default () => {
    const maleList = generateRandom('male');
    const femaleList = generateRandom('female');

    return {
        maleAvatars: maleList.map((obj) => [
            JSON.stringify(obj),
            ReactDOMServer.renderToString(<Avatar avatarStyle="Transparent" {...obj} />),
        ]),
        femaleAvatars: femaleList.map((obj) => [
            JSON.stringify(obj),
            ReactDOMServer.renderToString(<Avatar avatarStyle="Transparent" {...obj} />),
        ]),
    };
};
