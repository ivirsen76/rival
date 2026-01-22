import { useMemo } from 'react';
import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import Select from '@/components/formik/Select';
import { useQuery } from 'react-query';
import axios from '@/utils/axios';
import { useSelector } from 'react-redux';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';

type SwitchLadderFormProps = {
    onSubmit?: (...args: unknown[]) => unknown;
    tournament?: object;
};

const SwitchLadderForm = (props: SwitchLadderFormProps) => {
    const { tournament, onSubmit } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const { changedCount, joinForFree } = currentUser.tournaments[tournament.id];

    const { data: levels, isLoading } = useQuery('getPossibleTournaments', async () => {
        const response = await axios.put('/api/players/0', {
            action: 'getPossibleTournaments',
            seasonId: tournament.seasonId,
        });
        return response.data.data;
    });

    const { levelOptions, hasSuitableTournament } = useMemo(() => {
        if (!levels) {
            return {};
        }

        const _hasSuitableTournament =
            currentUser.establishedElo &&
            levels.some(
                (item) =>
                    item.baseTlr &&
                    item.isActivePlay &&
                    item.gender === currentUser.gender &&
                    Math.abs(item.baseTlr - currentUser.establishedElo) <= 50
            );

        const _levelOptions = levels
            .filter((item) => {
                if (!currentUser.isPlayingForFree && item.type !== tournament.levelType) {
                    return false;
                }
                if (!_hasSuitableTournament) {
                    return true;
                }
                if (item.id === tournament.id) {
                    return true;
                }
                if (item.gender !== currentUser.gender) {
                    return false;
                }
                if (!item.baseTlr) {
                    return true;
                }

                return Math.abs(item.baseTlr - currentUser.establishedElo) <= 50;
            })
            .map((item) => {
                const disabled = Boolean(item.playerId);

                return {
                    value: item.id,
                    label: item.name + (disabled ? ' (Your current ladder)' : ''),
                    disabled,
                };
            });

        return {
            hasSuitableTournament: _hasSuitableTournament,
            levelOptions: _levelOptions,
        };
    }, [currentUser, levels]);

    if (isLoading) {
        return <Loader loading />;
    }

    if (joinForFree) {
        return (
            <div className="alert alert-danger mb-0">
                You cannot switch ladders because you joined this ladder for free.
            </div>
        );
    }

    if (changedCount > 0) {
        return <div className="alert alert-danger mb-0">You cannot switch ladder more than one time.</div>;
    }

    if (tournament.tooLateToSwitchLadder) {
        return (
            <div className="alert alert-danger mb-0">
                You cannot switch ladders during the last two weeks of the season.
            </div>
        );
    }

    return (
        <Formik
            initialValues={{ to: 0 }}
            onSubmit={async (values) => {
                await axios.put('/api/players/0', {
                    action: 'switchTournament',
                    from: tournament.id,
                    to: values.to,
                });

                const levelTo = levels.find((level) => level.id === values.to);
                onSubmit &&
                    onSubmit({
                        levelName: levelTo.name,
                        url: `/season/${tournament.season.toLowerCase().replace(' ', '/')}/${levelTo.slug}`,
                    });
            }}
        >
            {({ isSubmitting, values }) => (
                <Form noValidate>
                    {hasSuitableTournament ? (
                        <p>
                            Since your <b className="text-body">TLR is {formatElo(currentUser.establishedElo)}</b>,{' '}
                            you&apos;re allowed to switch only to the following ladders. Other ladders are too weak or
                            too strong for you.
                        </p>
                    ) : (
                        <p>
                            If you feel that {tournament.level} ladder doesn&apos;t match your level, you can switch to
                            another ladder.
                        </p>
                    )}
                    <p className="alert alert-danger">
                        <strong>Warning</strong>: You can only switch once and cannot go back.
                    </p>
                    <Field
                        name="to"
                        label="New ladder"
                        component={Select}
                        options={[{ value: 0, label: '-- Choose ladder --' }, ...levelOptions]}
                    />

                    <Button isSubmitting={isSubmitting}>Submit</Button>
                </Form>
            )}
        </Formik>
    );
};

export default SwitchLadderForm;
