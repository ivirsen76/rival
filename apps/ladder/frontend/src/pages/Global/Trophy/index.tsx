import PropTypes from 'prop-types';
import Card from '@/components/Card';
import axios from '@/utils/axios';
import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import Error from '@/components/Error';
import Table from '@/components/Table';
import Tooltip from '@/components/Tooltip';
import notification from '@/components/notification';
import copy from 'clipboard-copy';
import classnames from 'classnames';
import formatNumber from '@rival/ladder.backend/src/utils/formatNumber';
import saveAsCsv from '@/utils/saveAsCsv';
import getRelativeStringLength from '@/utils/getRelativeStringLength';
import CheckIcon from '@/styles/metronic/icons/duotone/Navigation/Check.svg?react';
import CloseIcon from '@/styles/metronic/icons/duotone/Navigation/Close.svg?react';

const rewardOptions = {
    gift: 'Gift card',
    credit: 'Credit',
};

function saveFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

const TrophyReport = (props) => {
    const { selectedRows, data } = props;

    const generateSvg = () => {
        const rows = data
            .filter((row) => selectedRows.includes(row.id))
            .reduce((arr, item) => {
                if (item.result) {
                    arr.push(item);
                } else {
                    arr.push({ ...item, id: item.id + 800000, result: 'Champion' });
                    arr.push({ ...item, id: item.id + 900000, result: 'Runner-Up' });
                }

                return arr;
            }, []);

        if (rows.length === 0) {
            return;
        }

        const chunkArray = (array, chunkSize) => {
            const result = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                result.push(array.slice(i, i + chunkSize));
            }
            return result;
        };

        const MAX_LABELS_ON_PAGE = 60;
        const chunks = chunkArray(rows, MAX_LABELS_ON_PAGE);

        for (const chunk of chunks) {
            const PLATE_WIDTH = 580;
            const PLATE_HEIGHT = 240;
            const PLATES_IN_ROW = 5;
            const NAME_FONT_SIZE = 43;
            const width = Math.min(chunk.length, PLATES_IN_ROW) * PLATE_WIDTH;
            const height = Math.ceil(chunk.length / PLATES_IN_ROW) * PLATE_HEIGHT;

            const texts = [];
            const logos = [];
            const lines = [];

            chunk.forEach((row, index) => {
                const translateX = PLATE_WIDTH * (index % 5);
                const translateY = PLATE_HEIGHT * Math.floor(index / 5);

                const getX = (x) => x + translateX;
                const getY = (y) => y + translateY;

                const nameLength = getRelativeStringLength(row.name);
                const nameFontSize = Math.floor(Math.min((NAME_FONT_SIZE * 17) / nameLength, NAME_FONT_SIZE));

                if (row.teamName) {
                    texts.push(`<text x="${getX(25)}" y="${getY(160)}">Team "${row.teamName}"</text>`);
                } else {
                    texts.push(`<text x="${getX(25)}" y="${getY(117)}">${row.result}</text>`);
                }

                texts.push(
                    `<text x="${getX(25)}" y="${getY(208)}" font-size="${nameFontSize}" font-weight="700">${
                        row.name
                    }</text>`
                );
                texts.push(`<text x="${getX(555)}" y="${getY(45)}" text-anchor="end">${row.city}, ${row.state}</text>`);
                texts.push(`<text x="${getX(555)}" y="${getY(81)}" text-anchor="end">${row.season}</text>`);
                texts.push(`<text x="${getX(555)}" y="${getY(117)}" text-anchor="end">${row.level}</text>`);

                logos.push(`<use href="#rival" x="${getX(0)}" y="${getY(0)}" />`);
            });

            for (let i = 0; i <= Math.round(height / PLATE_HEIGHT); i++) {
                const lineWidth =
                    chunk.length % PLATES_IN_ROW === 0 ||
                    chunk.length <= PLATES_IN_ROW ||
                    i < Math.round(height / PLATE_HEIGHT)
                        ? width
                        : (chunk.length % PLATES_IN_ROW) * PLATE_WIDTH;

                lines.push(`M 0 ${i * PLATE_HEIGHT} L ${lineWidth} ${i * PLATE_HEIGHT}`);
            }
            for (let i = 0; i <= Math.round(width / PLATE_WIDTH); i++) {
                const longerLines = (chunk.length % PLATES_IN_ROW) + 1;
                const lineHeight =
                    chunk.length % PLATES_IN_ROW === 0 || chunk.length <= PLATES_IN_ROW || i < longerLines
                        ? height
                        : height - PLATE_HEIGHT;

                lines.push(`M ${i * PLATE_WIDTH} 0 L ${i * PLATE_WIDTH} ${lineHeight}`);
            }

            const svg = `<svg
    width="${width}px"
    height="${height}px"
    viewBox="0 0 ${width} ${height}"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
>
    <defs>
        <path id="rival" d="M 19.95 29.52 C 21.5 33.96 22.94 38.5 24.18 43.35 C 26.35 51.6 28.51 61.91 28.51 71.82 L 28.51 75.32 C 28.41 78.11 28.31 80.79 28.31 83.99 L 45.33 80.69 C 45.33 78.63 45.22 75.74 45.12 72.75 C 45.02 69.86 44.81 66.76 44.5 64.39 C 47.18 64.39 49.87 64.8 52.65 65.53 C 58.01 67.18 63.07 69.44 67.4 72.13 C 71.73 74.81 74.93 77.28 76.79 78.83 C 77.72 79.56 78.13 79.97 78.23 79.97 C 78.34 79.97 78.75 79.86 79.57 79.56 C 80.3 79.25 81.33 78.94 82.46 78.42 L 86.18 76.98 C 88.86 75.94 91.13 75.01 92.57 74.4 C 93.19 74.09 93.5 73.98 93.5 73.88 C 91.33 71.71 88.24 69.44 84.94 67.38 C 81.64 65.32 78.13 63.46 74.83 61.81 C 71.01 59.96 66.89 58.2 62.66 56.55 C 64.72 55.93 66.78 55.31 68.85 54.8 C 70.91 54.28 72.77 53.56 74.42 52.73 C 77.72 51.19 79.99 49.33 79.99 46.13 C 79.99 42.52 76.58 39.32 71.32 36.54 C 65.96 33.75 58.94 31.59 51.83 29.63 C 44.71 27.67 37.49 26.22 31.81 25.29 L 19.95 29.52 Z M 39.65 39.43 C 42.44 39.43 45.12 39.74 47.91 40.46 C 53.37 41.9 57.81 44.07 60.49 46.13 C 61.83 47.16 62.45 47.99 62.45 48.71 C 62.45 49.43 61.94 50.05 61.01 50.67 C 60.08 51.39 58.74 51.91 56.98 52.43 C 53.58 53.46 48.73 54.18 43.06 54.18 C 42.85 52.94 42.65 51.7 42.44 50.57 C 42.34 49.74 42.13 48.92 42.03 48.09 C 41.3 44.79 40.58 41.08 39.65 39.43 Z M 90.81 29.14 C 91.86 32.18 93.25 37.49 94.63 43.81 C 96.03 50.24 97.3 57.57 98.22 64.68 C 99.15 71.79 99.85 78.56 99.85 83.53 L 115.36 81.38 C 114.31 58.59 111.54 39.97 106.79 25.53 L 90.81 29.14 Z M 161.31 27.09 C 160.08 29.02 158.2 32.47 156.31 36.65 C 154.33 40.83 152.25 45.65 150.37 50.23 C 148.48 54.81 146.88 59.32 145.85 62.53 C 144.62 58.99 143.02 55.54 141.23 52.16 C 137.45 45.49 133.87 39.87 129.62 34.32 L 117.93 39.71 C 119.35 41.72 120.76 43.89 122.27 46.05 C 123.5 47.9 124.91 50.07 126.51 52.4 C 129.62 57.22 132.64 62.37 135 67.51 C 137.36 72.65 139.05 76.91 140.56 81.33 L 153.58 84.07 C 155.37 76.35 157.16 70.08 159.33 64.06 C 161.5 58.03 163.85 52.48 166.87 46.3 C 169.89 40.19 173.38 33.52 177.81 25.4 L 161.31 27.09 Z M 190.19 28.68 C 188.4 34 186.6 39.04 184.05 44.9 C 181.4 50.76 178.57 56.52 175.26 61.93 C 171.85 67.34 168.92 71.75 165.8 76.17 L 178.47 83.1 L 186.79 69.86 L 201.73 69.23 L 209.29 82.2 L 225.84 84.1 C 221.77 76.89 218.28 68.96 215.53 62.02 C 212.79 55.08 210.81 49.14 209.77 45.62 C 207.5 38.32 205.42 31.74 205.42 25.53 L 190.19 28.68 Z M 189.53 62.11 L 196.06 49.23 L 200.5 61.57 L 189.53 62.11 Z M 223.68 30.41 C 225.3 34.91 227.13 44.36 228.64 54.6 C 230.15 64.95 231.12 75.98 231.12 83.52 C 231.34 83.52 235.66 83.41 244.08 83.07 L 272.78 77.34 L 277.32 63.38 L 246.02 68.11 C 244.08 50.66 241.59 36.59 238.47 25.68 L 223.68 30.41 Z" />
    </defs>
    
    <g fill="#000" stroke="none">
        ${logos.join('\n        ')}
    </g>

    <g font-family="Poppins" font-size="28" font-weight="500" fill="#000" stroke="none">
        ${texts.join('\n        ')}
    </g>

    <path stroke="#000" fill="none" vector-effect="non-scaling-stroke" d="${lines.join(' ')}" />
</svg>`;

            saveFile(svg, 'trophy.svg');
        }
    };

    return (
        <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={generateSvg}
            disabled={selectedRows.length === 0}
        >
            Trophy plates
        </button>
    );
};
TrophyReport.propTypes = {
    selectedRows: PropTypes.array,
    data: PropTypes.array,
};

const EmailCopy = (props) => {
    const { selectedRows, data } = props;

    const copyEmails = () => {
        const emails = data.filter((row) => selectedRows.includes(row.id)).map((row) => row.email);
        copy(emails.join('; '));
        notification({
            header: 'Success',
            message: `${emails.length} emails copied to the clipboard`,
        });
    };

    return (
        <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={copyEmails}
            disabled={selectedRows.length === 0}
        >
            Copy emails
        </button>
    );
};
EmailCopy.propTypes = {
    selectedRows: PropTypes.array,
    data: PropTypes.array,
};

const UspsSpreadsheet = (props) => {
    const { selectedRows, data } = props;

    const downloadSpreadsheet = () => {
        function cityToNumber(str) {
            let hash = 0;

            for (let i = 0; i < str.length; i++) {
                // eslint-disable-next-line no-bitwise
                hash = (hash * 31 + str.charCodeAt(i)) | 0; // 32-bit hash
            }

            // Ensure positive
            hash = Math.abs(hash);

            // Convert into 6-digit number with no leading zero
            return (hash % 9000) + 1000; // range: 1000–9999
        }

        const rows = data
            .filter((row) => row.address && row.address.length > 10 && selectedRows.includes(row.id))
            .map((row) => {
                const addressParts = row.address.split(',').map((item) => item.trim());
                const [citySlug, playerId] = row.id.split('_');
                const orderId = `${cityToNumber(citySlug)}${playerId}`;

                return {
                    Name: row.name,
                    Company: '',
                    Address: row.addressVerification?.addressLine1 || addressParts[0],
                    'Address Line 2': row.addressVerification?.addressLine2 || '',
                    City: row.addressVerification?.city || addressParts[1],
                    State: row.addressVerification?.state || addressParts[2],
                    Zipcode: row.addressVerification?.zip || addressParts[3],
                    Country: 'US',
                    'Order ID': orderId,
                    'Order Items': 'Trophy',
                    Pounds: 1,
                    Length: 8,
                    Width: 3.5,
                    Height: 2,
                    Comment: !row.addressVerification
                        ? 'Address is not verified.'
                        : row.addressVerification.confidence !== 1
                          ? `Confidence: ${row.addressVerification.confidence}. ${row.addressVerification.result}`
                          : '',
                    Email: row.email,
                };
            });

        if (rows.length === 0) {
            notification({
                type: 'danger',
                header: 'Error',
                message: `No data for spreadsheet.`,
            });
        } else {
            saveAsCsv(rows, `${data[0].season}.csv`);
        }
    };

    return (
        <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={downloadSpreadsheet}
            disabled={selectedRows.length === 0}
        >
            USPS spreadsheet
        </button>
    );
};
UspsSpreadsheet.propTypes = {
    selectedRows: PropTypes.array,
    data: PropTypes.array,
};

const Global = (props) => {
    const { data, isLoading, isSuccess } = useQuery(
        `global`,
        async () => {
            const response = await axios.put('/api/utils/0', { action: 'getGlobalStats' });
            return response.data.data;
        },
        {
            keepPreviousData: true,
            staleTime: 0,
        }
    );

    if (isLoading) {
        return <Loader loading />;
    }

    if (!isSuccess) {
        return <Error title="" message="Some error while getting global stats" />;
    }

    const finalistsPlayed = (() => {
        const list = data.finalists;
        const columns = [
            {
                name: 'name',
                label: 'Name',
                render: (value, row) => (
                    <div>
                        <span className={classnames('fw-bold', { 'text-muted': !row.result })}>{value}</span>
                        <br />
                        <a href={`mailto:${row.email}`}>{row.email}</a>
                    </div>
                ),
            },
            {
                name: 'city',
                label: 'City',
                render: (value, row) => (
                    <div>
                        <span className="fw-bold">{value}</span>
                        <br />
                        {row.level}
                    </div>
                ),
            },
            { name: 'result', label: 'Result', className: 'text-nowrap', render: (value, row) => value || '-' },
            {
                name: 'address',
                label: 'Address',
                render: (value, row) => {
                    if (!value) {
                        return '-';
                    }

                    const hasVerification = Boolean(row.addressVerification);
                    if (!hasVerification) {
                        return value;
                    }

                    const address = [
                        [row.addressVerification.addressLine1, row.addressVerification?.addressLine2]
                            .filter(Boolean)
                            .join(' '),
                        row.addressVerification.city,
                        row.addressVerification.state,
                        row.addressVerification.zip.replace(/-\d+$/, ''),
                    ].join(', ');

                    return (
                        <div>
                            {row.addressVerification.confidence === 1 ? (
                                <span className="svg-icon svg-icon-success svg-icon-3">
                                    <CheckIcon />
                                </span>
                            ) : (
                                <Tooltip
                                    content={
                                        <div>
                                            Confidence: {row.addressVerification.confidence}
                                            <br />
                                            {row.addressVerification.result}
                                        </div>
                                    }
                                >
                                    <span className="svg-icon svg-icon-danger svg-icon-3">
                                        <CloseIcon />
                                    </span>
                                </Tooltip>
                            )}{' '}
                            {address}
                        </div>
                    );
                },
            },
            {
                name: 'rewardType',
                label: 'Reward',
                className: 'text-nowrap',
                render: (value, row) => {
                    if (!rewardOptions[value] || row.rewardAmount === 0) {
                        return '-';
                    }
                    return `${value === 'gift' ? `$${row.rewardAmount / 100} ` : ''}${rewardOptions[value]}`;
                },
            },
        ];
        const rowActions = [
            {
                name: 'generatePlates',
                title: 'Generate trophy plates',
                component: TrophyReport,
            },
            {
                name: 'copyEmails',
                title: 'Copy Emails',
                component: EmailCopy,
            },
            {
                name: 'downloadUSPS',
                title: 'Download USPS',
                component: UspsSpreadsheet,
            },
        ];

        return <Table columns={columns} data={list} className="table tl-table w-auto" rowActions={rowActions} />;
    })();

    return (
        <Card>
            <h2>Summary</h2>
            <div className="d-flex gap-6">
                <div>
                    Final tournaments: <b>{data.championships}</b>
                </div>
                <div>
                    Trophies: <b>{data.trophies}</b>
                </div>
                <div>
                    Awards: <b>${formatNumber(data.awards)}</b>
                </div>
            </div>

            <h2>Finalists played</h2>
            {finalistsPlayed}
        </Card>
    );
};

export default Global;
