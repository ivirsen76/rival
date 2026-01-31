import Card from '@rival/common/components/Card';
import Modal from '@rival/common/components/Modal';
import notification from '@rival/common/components/notification';
import axios from '@rival/common/axios';
import confirmation from '@rival/common/utils/confirmation';
import showLoader from '@rival/common/utils/showLoader';
import FormWeeklySchedule from './FormWeeklySchedule';
import style from './style.module.scss';

const Actions = (props) => {
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

                <button type="button" className="btn btn-primary" onClick={recalculateElo}>
                    Recalculate TLR
                </button>
                <div className={style.description} />

                <button type="button" className="btn btn-primary" onClick={regenerateBadges}>
                    Regenerate badges
                </button>
                <div className={style.description}>It will take a while (30-60 seconds)</div>

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
