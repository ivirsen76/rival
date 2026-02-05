import Card from '@rival/common/components/Card';
import { useState } from 'react';
import SeasonIcon from '@/assets/season.svg?react';
import SeasonPicker from './SeasonPicker';
import Levels from './Levels';
import dayjs from '@rival/common/dayjs';
import { useSelector } from 'react-redux';
import Authentication from '@/components/Authentication';
import style from './style.module.scss';
import Loader from '@rival/common/components/Loader';
import axios from '@rival/common/axios';
import { useQuery } from 'react-query';
import Header from '@/components/Header';
import hasAnyRole from '@rival/common/utils/hasAnyRole';
import Error from '@rival/common/components/Error';
import FlagIcon from '@rival/common/metronic/icons/duotune/maps/map001.svg?react';
import useConfig from '@rival/common/utils/useConfig';
import type { Season, User } from '@rival/club.backend/src/types';

const format = (date: string | dayjs.Dayjs) => dayjs.tz(date).format('MMM D');

type RenderButtonParams = {
    info: any;
    currentUser: User;
    goToStep: (params: string) => void;
    selectedSeason: any;
};

type Info = {
    key: number;
    step: string;
    seasonId: number;
    tournaments: {
        list: any[];
        partners: any;
    };
};

type CurrentSeason = Season & { name: string };

export type StepComponentProps = {
    info: Info;
    updateInfo: (params: Partial<Info>) => void;
    user: User;
    selectedSeason: CurrentSeason;
    seasons: CurrentSeason[];
    goToNextStep: () => void;
};

type Step = {
    value: string;
    label: string;
    component: (params: StepComponentProps) => React.ReactNode;
    showButton?: (params: any) => boolean;
    renderButton: (params: RenderButtonParams) => React.ReactNode;
};

const steps: Step[] = [
    {
        value: 'season',
        label: 'Season',
        component: SeasonPicker,
        showButton: ({ seasons }) => seasons.length > 1,
        renderButton: ({ goToStep, selectedSeason }) => (
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
                                goToStep('season');
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
        renderButton: ({ info, goToStep, selectedSeason }: RenderButtonParams) => (
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
                            .filter((item) => info.tournaments.list.includes(item.tournamentId))
                            .map((item) => item.levelName)
                            .join(', ')}{' '}
                        <a
                            href=""
                            className="ms-1"
                            onClick={(e) => {
                                e.preventDefault();
                                goToStep('tournaments');
                            }}
                        >
                            Change
                        </a>
                    </div>
                </div>
            </div>
        ),
    },
];

const Register = () => {
    const user = useSelector((state) => state.auth.user);
    const config = useConfig();
    const [info, setInfo]: [Info, Function] = useState(() => ({
        key: 1,
        step: 'season',
        seasonId: 0,
        tournaments: {
            list: [],
            partners: {},
        },
    }));

    const { data: seasons, isLoading } = useQuery(`getSeasonsToRegister`, async () => {
        const response = await axios.put('/api/seasons/0', { action: 'getSeasonsToRegister' });
        return response.data.data;
    }) as { data: CurrentSeason[]; isLoading: boolean };

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

    const updateInfo = (obj: Partial<Info>) => {
        setInfo((prevInfo: Info) => ({ ...prevInfo, ...obj }));
    };

    const goToNextStep = () => {
        const index = steps.findIndex((item) => item.value === info.step);
        if (index + 1 < steps.length) {
            updateInfo({ step: steps[index + 1].value });
        }
    };

    const goToStep = (step: string) => {
        updateInfo({ step });
    };

    const prevSteps = [];
    for (const item of steps) {
        if (item.value === info.step) {
            break;
        }

        prevSteps.push(item);
    }

    const currentStep = steps.find((item) => item.value === info.step)!;
    const selectedSeason = seasons.find((item) => item.id === info.seasonId)!;

    return (
        <div data-register-area className="tl-panel">
            <Header
                title="Register"
                description="Register for your account and join at least one ladder to get started on the Rival Tennis Ladder."
            />
            <Card key={info.key}>
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
                {prevSteps.length > 0 && (
                    <div className="mb-6">
                        {prevSteps
                            .filter((item) => !item.showButton || item.showButton({ seasons }))
                            .map((item) => (
                                <div key={item.value} data-step={item.value}>
                                    {item.renderButton({
                                        info,
                                        currentUser: user,
                                        goToStep,
                                        selectedSeason,
                                    })}
                                </div>
                            ))}
                    </div>
                )}

                {!user ? (
                    <Authentication />
                ) : (
                    <currentStep.component
                        info={info}
                        updateInfo={updateInfo}
                        user={user}
                        selectedSeason={selectedSeason}
                        seasons={seasons}
                        goToNextStep={goToNextStep}
                    />
                )}
            </Card>
        </div>
    );
};

export default Register;
