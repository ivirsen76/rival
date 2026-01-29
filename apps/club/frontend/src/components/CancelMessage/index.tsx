import style from './style.module.scss';

type CancelMessageProps = {
    tournament: object;
};

const CancelMessage = (props: CancelMessageProps) => {
    const { cancelFinalTournamentReason, isFreeSeason, level } = props.tournament;
    const message =
        typeof cancelFinalTournamentReason === 'string' ? [cancelFinalTournamentReason] : cancelFinalTournamentReason;

    return (
        <div className={style.wrapper}>
            {message.map((item, index) => (
                <p key={index}>{item}</p>
            ))}
            {!isFreeSeason && (
                <>
                    <p>All players who paid an entry fee will receive a credit to their accounts.</p>
                    <p>
                        Due to the lower activity in this ladder this season, the{' '}
                        <b>{level} Ladder will be free next season</b> as we continue to grow participation.
                    </p>
                </>
            )}
        </div>
    );
};

export default CancelMessage;
