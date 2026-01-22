import { useState } from 'react';
import Card from '@/components/Card';
import Loader from '@/components/Loader';
import Error from '@/components/Error';
import Player from './Player';
import Levels from './Levels';
import Season from './Season';
import Payment from './Payment';
import Header from '@/components/Header';
import FlagIcon from '@/styles/metronic/icons/duotune/maps/map001.svg?react';
import SeasonIcon from '@/assets/season.svg?react';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import useConfig from '@/utils/useConfig';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';
import hasAnyRole from '@/utils/hasAnyRole';
import axios from '@/utils/axios';

const format = (date) => dayjs.tz(date).format('MMM D');

const stages = [
    {
        value: 'player',
        label: 'Player',
        component: Player,
    },
    {
        value: 'season',
        label: 'Season',
        component: Season,
        showButton: ({ seasons }) => seasons.length > 1,
        renderButton: ({ settings, currentUser, setStage, selectedSeason }) => (
            <div className={style.step}>
                <div className={style.highlight}>
                    <span className="svg-icon svg-icon-2x svg-icon-primary">
                        <SeasonIcon />
                    </span>
                </div>
                <div>
                    <div className={style.title}>Season</div>
                    <div>
                        {selectedSeason.name} ({format(selectedSeason.startDate)} -{' '}
                        {format(dayjs.tz(selectedSeason.endDate).subtract(1, 'minute'))}){' '}
                        <a
                            href=""
                            className="ms-1"
                            onClick={(e) => {
                                e.preventDefault();
                                setStage('season');
                            }}
                        >
                            Change
                        </a>
                    </div>
                </div>
            </div>
        ),
    },
    {
        value: 'tournaments',
        label: 'Levels',
        component: Levels,
        renderButton: ({ settings, currentUser, setStage, selectedSeason }) => (
            <div className={style.step}>
                <div className={style.highlight}>
                    <span className="svg-icon svg-icon-2x svg-icon-primary">
                        <FlagIcon />
                    </span>
                </div>
                <div>
                    <div className={style.title}>Ladders</div>
                    <div>
                        {selectedSeason.tournaments
                            .filter((item) => settings.list.includes(item.tournamentId))
                            .map((item) => item.levelName)
                            .join(', ')}{' '}
                        <a
                            href=""
                            className="ms-1"
                            onClick={(e) => {
                                e.preventDefault();
                                setStage('tournaments');
                            }}
                        >
                            Change
                        </a>
                    </div>
                </div>
            </div>
        ),
    },
    { value: 'payment', label: 'Payment', component: Payment },
];

const Register = (props) => {
    const user = useSelector((state) => state.auth.user);
    const config = useConfig();
    const { data: seasons, isLoading } = useQuery(`getSeasonsToRegister`, async () => {
        const response = await axios.put('/api/seasons/0', { action: 'getSeasonsToRegister' });
        return response.data.data;
    });
    const [stage, setStage] = useState(user ? 'season' : 'player');
    const [info, setInfo] = useState(() => {
        const url = new URL(window.location.href);
        const param = url.searchParams.get('step');
        const initialStep = ['new', 'login'].includes(param) ? param : 'new';

        return {
            player: {
                step: initialStep, // could be: login, new, verification
            },
            season: {
                id: 0,
            },
            tournaments: {
                list: [],
                partners: {},
            },
        };
    });

    if (isLoading) {
        return <Loader loading />;
    }

    if (user && !hasAnyRole(user, ['player'])) {
        return <Error title="" message="Admin cannot register as a player" />;
    }

    if (!config.canRegister) {
        return <Error title="" message="Registration is not available yet" />;
    }

    if (seasons.length === 0) {
        return <Error title="" message="There is no season to register yet" />;
    }

    const stageInfo = {
        ...stages.find((item) => item.value === stage),
        settings: info[stage],
    };

    const prevStages = [];
    for (const item of stages) {
        if (item.value === stage) {
            break;
        }

        prevStages.push(item);
    }

    const goToNextStage = () => {
        const index = stages.findIndex((item) => item.value === stage);
        if (index + 1 < stages.length) {
            setStage(stages[index + 1].value);
        }
    };

    const updateStageInfo = (values) => {
        setInfo({
            ...info,
            [stage]: {
                ...info[stage],
                ...values,
            },
        });
    };

    const selectedSeason = seasons.find((item) => item.id === info.season.id);

    return (
        <div data-register-area className="tl-panel">
            <Header
                title="Register"
                description={`Register for your account and pay for at least one ladder to get started on the Rival Tennis Ladder in ${config.city}.`}
            />
            <Card>
                {seasons.length === 1 && selectedSeason ? (
                    <>
                        <h2>{selectedSeason ? `Register for ${selectedSeason.name} Season` : 'Register'}</h2>
                        <div className="mb-6 mt-n2">
                            {format(selectedSeason.startDate)} -{' '}
                            {format(dayjs.tz(selectedSeason.endDate).subtract(1, 'minute'))}
                        </div>
                    </>
                ) : (
                    <h2>Register</h2>
                )}
                {prevStages.length > 0 && (
                    <div className="mb-6">
                        {prevStages
                            .filter((item) => item.renderButton && (!item.showButton || item.showButton({ seasons })))
                            .map((item) => (
                                <div key={item.value} {...{ [`data-stage-${item.value}`]: true }}>
                                    {item.renderButton({
                                        settings: info[item.value],
                                        currentUser: user,
                                        setStage,
                                        selectedSeason,
                                    })}
                                </div>
                            ))}
                    </div>
                )}
                <stageInfo.component
                    updateSettings={updateStageInfo}
                    settings={stageInfo.settings}
                    fullSettings={info}
                    onSubmit={goToNextStage}
                    selectedSeason={selectedSeason}
                    seasons={seasons}
                    user={user}
                />
            </Card>
        </div>
    );
};

export default Register;
