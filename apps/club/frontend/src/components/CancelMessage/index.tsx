import style from './style.module.scss';

type CancelMessageProps = {
    tournament: object;
};

const CancelMessage = (props: CancelMessageProps) => {
    const { cancelFinalTournamentReason, level } = props.tournament;
    const message =
        typeof cancelFinalTournamentReason === 'string' ? [cancelFinalTournamentReason] : cancelFinalTournamentReason;

    return (
        <div className={style.wrapper}>
            {message.map((item, index) => (
                <p key={index}>{item}</p>
            ))}
        </div>
    );
};

export default CancelMessage;
