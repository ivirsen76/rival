import Card from '@/components/Card';
import Modal from '@/components/Modal';
import notification from '@/components/notification';
import axios from '@/utils/axios';
import confirmation from '@/utils/confirmation';
import showLoader from '@/utils/showLoader';
import getAvatars from './getAvatars';
import FormGeneratePartnerLink from './FormGeneratePartnerLink';
import FormRosterMessage from './FormRosterMessage';
import FormWeeklySchedule from './FormWeeklySchedule';
import style from './style.module.scss';

const Actions = props => {
    const publish = async () => {
        const confirm = await confirmation({ message: 'Do you really want to publish updates?' });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'publishUpdates' });
        });

        notification({
            header: 'Success',
            message: 'The changes are published successfully.',
        });
    };

    const runActions = async () => {
        const confirm = await confirmation({ message: 'Do you really want to run all actions?' });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'runActions' });
        });

        notification({
            header: 'Success',
            message: 'All actions have been run.',
        });
    };

    const syncGlobalState = async () => {
        const confirm = await confirmation({ message: 'Do you really want to sync global state?' });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'syncGlobalState' });
        });

        notification({
            header: 'Success',
            message: 'Global state has been synced.',
        });
    };

    const generateRabbits = async () => {
        const confirm = await confirmation({ message: 'Do you really want to generate rabbits?' });
        if (!confirm) {
            return;
        }

        const { maleAvatars, femaleAvatars } = getAvatars();

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'generateRabbits', maleAvatars, femaleAvatars });
        });

        notification({
            header: 'Success',
            message: 'Rabbits are successfuly generated.',
        });
    };

    const regenerateBadges = async () => {
        const confirm = await confirmation({ message: 'Do you really want to regenerate badges?' });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'generateBadges' });
        });

        notification({
            header: 'Success',
            message: 'Badges were regenerated.',
        });
    };

    const recalculateElo = async () => {
        const confirm = await confirmation({ message: 'Do you really want to calculate TLR and points?' });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'recalculateElo' });
        });

        notification({
            header: 'Success',
            message: 'TLR and points are calculated.',
        });
    };

    const processRosters = async () => {
        const confirm = await confirmation({ message: 'Do you really want to process rosters?' });
        if (!confirm) {
            return;
        }

        await showLoader(async () => {
            await axios.put('/api/utils/0', { action: 'processRosters' });

            notification({
                header: 'Success',
                message: `All rosters has been processed.`,
            });
        });
    };

    return (
        <Card>
            <div className={style.wrapper}>
                <button type="button" className="btn btn-primary" onClick={publish}>
                    Publish updates
                </button>
                <div className={style.description}>
                    Generate next season, generate news, publish stats to store.tennis-ladder.com
                </div>

                <button type="button" className="btn btn-primary" onClick={runActions}>
                    Run actions
                </button>
                <div className={style.description}>Send all reminders</div>

                <button type="button" className="btn btn-primary" onClick={syncGlobalState}>
                    Sync global state
                </button>
                <div className={style.description}>Get cities nearby and weather forecast</div>

                <button type="button" className="btn btn-primary" onClick={recalculateElo}>
                    Recalculate TLR
                </button>
                <div className={style.description} />

                <button type="button" className="btn btn-primary" onClick={regenerateBadges}>
                    Regenerate badges
                </button>
                <div className={style.description}>It will take a while (30-60 seconds)</div>

                <button type="button" className="btn btn-primary" onClick={generateRabbits}>
                    Generate rabbits
                </button>
                <div className={style.description} />

                <Modal
                    title="Generate partner link"
                    renderTrigger={({ show }) => (
                        <button type="button" className="btn btn-primary" onClick={show}>
                            Generate partner link
                        </button>
                    )}
                    renderBody={({ hide }) => <FormGeneratePartnerLink hide={hide} />}
                />
                <div className={style.description}>Partner can register using this link.</div>

                <button type="button" className="btn btn-primary" onClick={processRosters}>
                    Process rosters
                </button>
                <div className={style.description} />

                <Modal
                    title="Send one roster message"
                    renderTrigger={({ show }) => (
                        <button type="button" className="btn btn-primary" onClick={show}>
                            Send one roster message
                        </button>
                    )}
                    renderBody={({ hide }) => <FormRosterMessage hide={hide} />}
                />
                <div className={style.description}>Send roster email to arbitrary email</div>

                <Modal
                    title="Weekly schedule demo"
                    renderTrigger={({ show }) => (
                        <button type="button" className="btn btn-primary" onClick={show}>
                            Weekly schedule demo
                        </button>
                    )}
                    renderBody={({ hide }) => <FormWeeklySchedule hide={hide} />}
                />
                <div className={style.description} />
            </div>
        </Card>
    );
};

export default Actions;
