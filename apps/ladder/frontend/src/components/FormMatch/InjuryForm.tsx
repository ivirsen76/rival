import { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PlayerName from '@/components/PlayerName';
import style from './style.module.scss';

const InjuryForm = props => {
    const { challenger, acceptor, challenger2, acceptor2, onSubmit, hide } = props;
    const [playerId, setPlayerId] = useState(props.injuredPlayerId);

    const challengerName = <PlayerName player1={challenger} player2={challenger2} />;
    const acceptorName = <PlayerName player1={acceptor} player2={acceptor2} />;

    const isTeam = Boolean(challenger2 || acceptor2);

    return (
        <div className="text-start">
            <div>
                <label className="form-label">Who retired?</label>
            </div>
            <div className="btn-group w-100">
                <button
                    type="button"
                    className={classnames(style.number, 'ps-4 pe-4', playerId === challenger.id && style.active)}
                    onClick={() => setPlayerId(challenger.id)}
                >
                    {challengerName}
                </button>
                <button
                    type="button"
                    className={classnames(style.number, 'ps-4 pe-4', playerId === acceptor.id && style.active)}
                    onClick={() => setPlayerId(acceptor.id)}
                >
                    {acceptorName}
                </button>
            </div>

            <div className="alert alert-primary mt-4">
                <ul className="ps-4 mb-0">
                    <li>
                        Retirements are valid for reasons including injuries, heat exhaustion, personal emergencies,
                        time commitments, or other similar situations.
                    </li>
                    <li>
                        Only report a retirement if a {isTeam ? 'team' : 'player'} couldn&apos;t finish the match.
                        Complete matches don&apos;t qualify for a retirement.
                    </li>
                    <li>
                        When reporting a retirement, record the score at the moment of stopping the match (e.g., 6-2,
                        2-0).
                    </li>
                </ul>
            </div>

            <div className="mt-4">
                <button type="submit" className="btn btn-primary" onClick={() => onSubmit(playerId)}>
                    Submit
                </button>
                <button type="button" className="btn btn-secondary ms-2" onClick={hide}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

InjuryForm.propTypes = {
    challenger: PropTypes.object,
    acceptor: PropTypes.object,
    challenger2: PropTypes.object,
    acceptor2: PropTypes.object,
    injuredPlayerId: PropTypes.number,
    onSubmit: PropTypes.func,
    hide: PropTypes.func,
};

InjuryForm.defaultProps = {};

export default InjuryForm;
