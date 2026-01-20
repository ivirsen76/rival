import formatElo from './formatElo';
import { getSuitableTournaments } from '../services/tournaments/helpers';
import _round from 'lodash/round';

const isRequired = () => {
    throw new Error('Param is required');
};

export const getLevelList = levels => {
    const menSingles = levels.filter(level => level.levelType === 'single' && /^Men/i.test(level.levelName));
    const womenSingles = levels.filter(level => level.levelType === 'single' && /^Women/i.test(level.levelName));
    const menDoubles = levels.filter(level => level.levelType === 'doubles-team' && /^Men/i.test(level.levelName));
    const womenDoubles = levels.filter(level => level.levelType === 'doubles-team' && /^Women/i.test(level.levelName));

    const result = [];

    for (const singles of [menSingles, womenSingles]) {
        if (singles.length === 0) {
            continue;
        }

        const group = singles[0].levelName.split(' ')[0];
        const range = `${singles[0].levelName.match(/\d\.\d/)[0]}-${
            singles[singles.length - 1].levelName.match(/\d\.\d/)[0]
        }`;
        result.push(`${group} ${range}`);
    }

    const doubles = [menDoubles, womenDoubles]
        .filter(list => list.length > 0)
        .map(list => list[0].levelName.split(' ')[0])
        .join(' and ');
    if (doubles) {
        result.push(`${doubles} Doubles`);
    }

    return result;
};

const generateSquirclePath = (x, y, width, height) => {
    const r = Math.min(width, height) * 0.5;

    const path = [];
    path.push(`M ${x + r} ${y}`);
    if (width > height) {
        path.push(`L ${x + width - r} ${y}`);
    }
    path.push(`C ${x + width} ${y} ${x + width} ${y} ${x + width} ${y + r}`);
    if (height > width) {
        path.push(`L ${x + width} ${y + height - r}`);
    }
    path.push(`C ${x + width} ${y + height} ${x + width} ${y + height} ${x + width - r} ${y + height}`);
    if (width > height) {
        path.push(`L ${x + r} ${y + height}`);
    }
    path.push(`C ${x} ${y + height} ${x} ${y + height} ${x} ${y + height - r}`);
    if (height > width) {
        path.push(`L ${x} ${y + r}`);
    }
    path.push(`C ${x} ${y} ${x} ${y} ${x + r} ${y}`);
    path.push(`Z`);

    return path.join(' ');
};

const getBlock = ({ x, y, width, height, title, description, hue }) => {
    const gradientId = `block-${x}-${y}`;

    const titleSize = 28;
    const descriptionSize = 15;
    const gap = 5;
    const margin = 10;
    const middleX = x + width / 2;
    const textHeight =
        title.length * titleSize +
        (title.length - 1) * gap +
        margin +
        description.length * descriptionSize +
        (description.length - 1) * gap;
    let currentY = y + (height - textHeight) / 2;
    const lightness = 45;

    return `
<g>
    <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue - 15}, 80%, ${lightness - 5}%)" />
            <stop offset="100%" stop-color="hsl(${hue + 15}, 80%, ${lightness - 5}%)" />
        </linearGradient>
    </defs>
    <path d="${generateSquirclePath(x, y, width, height)}" fill="hsl(230, 40%, 100%, 0.9)" />
${title
    .map((str, index) => {
        if (index !== 0) {
            currentY += gap;
        }

        currentY += titleSize;

        const result = `
    <text
        x="${middleX}"
        y="${currentY - titleSize * 0.12}"
        font-size="${titleSize}"
        font-weight="bold"
        text-anchor="middle"
        fill="url(#${gradientId})"
        data-title="${str}"
    >${str}</text>`;

        return result;
    })
    .join('\n\n')}
${description
    .map((str, index) => {
        if (index === 0) {
            currentY += margin;
        } else {
            currentY += gap;
        }
        currentY += descriptionSize;

        const result = `
    <text
        x="${middleX}"
        y="${currentY - descriptionSize * 0.12}"
        font-size="${descriptionSize}"
        text-anchor="middle"
        fill="hsl(228, 38%, 50%)"
        data-description="${str}"
    >${str}</text>`;

        return result;
    })
    .join('\n\n')}
</g>`;
};

const getSeasonSvg = ({
    season = isRequired(),
    levels = isRequired(),
    config = isRequired(),
    creditAmount,
    elo,
    matchesPlayed,
    currentDate = isRequired(),
    scale = 1,
    totalPlayers = 0,
    gender = 'male',
}) => {
    const isFreeSeason = Boolean(season.isFree);
    const mustPay = !isFreeSeason && matchesPlayed >= config.minMatchesToPay;
    const hasCredit = mustPay && creditAmount > 0;
    const hasElo = Boolean(elo);
    const isSeasonStarted = season.startDate < currentDate;
    const showTotalPlayers = totalPlayers >= 100;

    const backgroundUrl = (() => {
        if (season.season === 'winter') {
            return 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/seasons/winter.jpg';
        }

        // TODO: come up with other season images. Return winter one for now.
        return 'https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/seasons/winter.jpg';
    })();

    const allLadders = getLevelList(levels);
    const suitableLadders = (() => {
        if (!hasElo) {
            return allLadders;
        }

        const levelObj = levels.reduce((obj, item) => {
            obj[item.tournamentId] = item;
            return obj;
        }, {});

        const suitableLevels = getSuitableTournaments(levels, elo, gender)
            .all.slice(0, 3)
            .map(id => levelObj[id].levelName);

        return suitableLevels;
    })();

    const costSettings = {
        title: isFreeSeason ? ['Free to Join'] : mustPay ? ['Cost'] : ['Free for You'],
        description: (() => {
            if (isFreeSeason) {
                return ['All fun, no fees'];
            }
            if (!mustPay) {
                return ['Join anytime'];
            }

            const explanation = isSeasonStarted ? 'After the season begins:' : 'Before the season begins:';
            const singlesCost = (config.singlesCost - (isSeasonStarted ? 0 : config.earlyRegistrationDiscount)) / 100;
            const doublesCost = (config.doublesCost - (isSeasonStarted ? 0 : config.earlyRegistrationDiscount)) / 100;

            return [explanation, `$${singlesCost} Singles`, `$${doublesCost} Doubles`];
        })(),
    };

    const blocks = [];

    // Dates
    blocks.push({
        title: [season.dates],
        description: [`${season.weeks} weeks`],
    });

    // Prizes
    blocks.push({
        title: ['Prizes'],
        description: isFreeSeason
            ? [`$${config.singlesChampionReward / 100 / 2} for Champion`]
            : [
                  `$${config.singlesChampionReward / 100} for Champion`,
                  `$${config.singlesRunnerUpReward / 100} for Runner-Up`,
              ],
    });

    if (!mustPay && !hasElo) {
        blocks.push(costSettings);
        blocks.push({
            title: ['Ladders'],
            description: suitableLadders,
        });
    } else {
        blocks.push(costSettings);

        if (mustPay) {
            blocks.push({
                title: hasCredit
                    ? [`$${Math.floor(creditAmount / 100)} Credit`]
                    : [`$${config.additionalLadderDiscount / 100} Discount`],
                description: hasCredit ? ['Available for payment'] : ['For additional ladder'],
            });
        }

        if (hasElo) {
            blocks.push({
                title: [`TLR ${formatElo(elo)}`],
                description: ['You current rating'],
            });
        }

        blocks.push({
            title: hasElo ? ['Ladders for You'] : ['Available Ladders'],
            description: suitableLadders,
        });
    }

    const width = 640;
    const gap = 15;
    const left = gap * 1.5;
    const between = 40;
    const blockWidth = _round((width - 2 * left - gap) / 2, 3);
    const blockHeight = _round(blockWidth / 2, 3);
    const headerSize = 50;
    const buttonWidth = _round(width / 2.5, 3);
    const buttonHeight = _round(buttonWidth / 4.7, 3);
    const height = _round(
        Math.ceil(blocks.length / 2) * (blockHeight + gap) -
            gap +
            headerSize +
            buttonHeight * (showTotalPlayers ? 1.5 : 1) +
            between * 4,
        3
    );
    let currentY = _round(headerSize + between * 2, 3);

    return `<svg
        width="${width * scale}"
        height="${height * scale}"
        viewBox="0 0 ${width} ${height}"
        font-family="Poppins"
    >
    <defs>
        <linearGradient id="seasonBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="hsl(208, 71%, 41%, 0.75)" />
            <stop offset="50%" stop-color="hsl(208, 71%, 41%, 0.25)" />
            <stop offset="100%" stop-color="hsl(208, 71%, 41%, 0.75)" />
        </linearGradient>
        <linearGradient id="registerButtonBg" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="hsl(58, 83%, 66%)" />
            <stop offset="100%" stop-color="hsl(66, 53%, 54%)" />
        </linearGradient>
    </defs>

    <image
        href="${backgroundUrl}"
        width="${width}"
        height="${height}"
        x="0"
        y="0"
        preserveAspectRatio="xMidYMid slice"
    />

    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#seasonBg)" />

    <text
        x="${width / 2}"
        y="${between + headerSize * 0.9}"
        font-size="${headerSize}"
        font-weight="bold"
        fill="#ffffff"
        text-anchor="middle"
    >
        ${season.name}
    </text>

    ${blocks
        .map((params, index) => {
            const isOdd = Boolean(index % 2);
            const isLast = index === blocks.length - 1;
            const x = isOdd ? left + blockWidth + gap : left;
            const hue = 200 + index * 50;

            const result = getBlock({
                x,
                y: currentY,
                width: !isOdd && index === blocks.length - 1 ? 2 * blockWidth + gap : blockWidth,
                height: blockHeight,
                hue,
                ...params,
            });

            if (isOdd || isLast) {
                currentY += blockHeight + gap;
            }

            return result;
        })
        .join('\n\n')}

    ${(() => {
        currentY = currentY - gap + between;
    })()}

    <path d="${generateSquirclePath(
        _round(width / 2 - buttonWidth / 2, 3),
        _round(currentY, 3),
        buttonWidth,
        buttonHeight
    )}" fill="url(#registerButtonBg)" />
    <text
        x="${_round(width / 2, 3)}"
        y="${_round(currentY + buttonHeight * 0.65, 3)}"
        font-size="${buttonHeight / 2}"
        font-weight="bold"
        fill="hsl(60, 58%, 11%)"
        text-anchor="middle"
    >
        Register Now
    </text>
    ${
        showTotalPlayers
            ? `<text
        x="${width / 2}"
        y="${currentY + buttonHeight * 1.5}"
        font-size="${buttonHeight / 3}"
        font-weight="500"
        fill="#fff"
        text-anchor="middle"
    >
        ${totalPlayers} players already joined
    </text>`
            : ''
    }
</svg>`;
};

export default getSeasonSvg;
