import Profile from './Profile';
import Modal from '@rival/common/components/Modal';
import style from './style.module.scss';

type CoachProps = {
    list: unknown[];
};

const Coach = (props: CoachProps) => {
    const { list } = props;

    return (
        <div className={style.wrapper}>
            {list.map((coach) => (
                <div className={style.block} key={coach.id}>
                    <div className={style.photo} style={{ backgroundImage: `url(${coach.photo})` }} />
                    <div>
                        <h3 className={style.name}>
                            {coach.firstName} {coach.lastName}
                        </h3>

                        <div className={style.location}>{coach.locationName}</div>
                        <div className={style.price}>${coach.price} per hour</div>

                        <div className="mt-3">
                            <Modal
                                title={`Coach ${coach.firstName} ${coach.lastName}`}
                                renderTrigger={({ show }) => (
                                    <button className="btn btn-success btn-xs" type="button" onClick={show}>
                                        View profile
                                    </button>
                                )}
                                renderBody={({ hide }) => <Profile coach={coach} hide={hide} />}
                                hasForm={false}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Coach;
