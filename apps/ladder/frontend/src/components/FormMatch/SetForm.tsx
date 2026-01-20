import PropTypes from 'prop-types';
import GamePicker from './GamePicker';
import Tooltip from '@/components/Tooltip';
import classnames from 'classnames';
import getScoreAsString from './getScoreAsString';
import {
    isFullSetScoreCorrect,
    isFastSetScoreCorrect,
    isFullScoreCorrect,
    isFastScoreCorrect,
} from '@rival/ladder.backend/src/services/matches/helpers';
import style from './style.module.scss';

const SetForm = (props) => {
    const { values, setValues, errors, challengerName, acceptorName, goToNextSet } = props;
    const allowMatchTieBreak = !values.wonByInjury && values.currentSetNumber === 3;

    const currentSet = values.score[values.currentSetNumber - 1];
    const [challengerPoints, acceptorPoints] = currentSet;
    const isFast4 = values.matchFormat === 2;
    const maxSetPoints = isFast4 ? 4 : 7;

    const updateCurrentSet = (num1, num2, extraValues = {}) => {
        const newScore = values.score.map((item, index) => (item !== currentSet ? item : [num1, num2]));
        const advanceScore = newScore.map((item, index) => (index < values.currentSetNumber ? item : [null, null]));
        const scoreAsString = getScoreAsString({ ...values, wonByInjury: false, score: advanceScore });
        const isScoreCorrect = isFast4 ? isFastScoreCorrect : isFullScoreCorrect;
        const isSetScoreCorrect = isFast4 ? isFastSetScoreCorrect : isFullSetScoreCorrect;

        setValues({
            ...values,
            ...extraValues,
            score: newScore,
        });

        // Auto advance
        (() => {
            if (!isSetScoreCorrect({ challengerPoints: num1, acceptorPoints: num2 })) {
                return;
            }
            if (isScoreCorrect(scoreAsString)) {
                return;
            }
            if (values.currentSetNumber >= 3) {
                return;
            }
            if (isFast4 && values.wonByInjury && values.currentSetNumber !== 1) {
                return;
            }

            setTimeout(goToNextSet, 500);
        })();
    };

    const updateChallengerPoints = (num) => {
        const ap = (() => {
            if (values.wonByInjury) {
                return acceptorPoints;
            }
            if (num === null) {
                return acceptorPoints;
            }
            if (values.currentSetNumber === 3 && values.isMatchTieBreak) {
                return acceptorPoints;
            }
            if (maxSetPoints === 4) {
                if (num < maxSetPoints) {
                    return maxSetPoints;
                }
            }
            if (maxSetPoints === 7) {
                if (num === 5) {
                    return 7;
                }
                if (num < 5) {
                    return 6;
                }
            }

            return acceptorPoints;
        })();

        updateCurrentSet(num, ap);
    };

    const updateAcceptorPoints = (num) => {
        const cp = (() => {
            if (values.wonByInjury) {
                return challengerPoints;
            }
            if (num === null) {
                return challengerPoints;
            }
            if (values.currentSetNumber === 3 && values.isMatchTieBreak) {
                return challengerPoints;
            }
            if (maxSetPoints === 4) {
                if (num < maxSetPoints) {
                    return maxSetPoints;
                }
            }
            if (maxSetPoints === 7) {
                if (num === 5) {
                    return 7;
                }
                if (num < 5) {
                    return 6;
                }
            }

            return challengerPoints;
        })();

        updateCurrentSet(cp, num);
    };

    const error = errors.score;
    const showError = Boolean(error);

    return (
        <div>
            {allowMatchTieBreak && !isFast4 && (
                <div className="btn-group w-100 mb-6">
                    <button
                        type="button"
                        className={classnames(style.number, 'p-2', values.isMatchTieBreak && style.active)}
                        style={{ flexBasis: 0 }}
                        onClick={() => {
                            updateCurrentSet(null, null, { isMatchTieBreak: true });
                        }}
                    >
                        10-point tiebreak
                    </button>
                    <button
                        type="button"
                        className={classnames(style.number, 'p-2', !values.isMatchTieBreak && style.active)}
                        style={{ flexBasis: 0 }}
                        onClick={() => {
                            updateCurrentSet(null, null, { isMatchTieBreak: false });
                        }}
                    >
                        Full set
                    </button>
                </div>
            )}

            {allowMatchTieBreak && values.isMatchTieBreak ? (
                <>
                    <div>
                        <label className="form-label">Who won the tiebreak?</label>
                    </div>
                    <div className="btn-group-vertical">
                        <button
                            type="button"
                            className={classnames(
                                style.number,
                                style.vertical,
                                'ps-4 pe-4',
                                challengerPoints === 1 && style.active
                            )}
                            onClick={() => {
                                updateCurrentSet(1, 0);
                            }}
                        >
                            {challengerName}
                        </button>
                        <button
                            type="button"
                            className={classnames(
                                style.number,
                                style.vertical,
                                'ps-4 pe-4',
                                acceptorPoints === 1 && style.active
                            )}
                            onClick={() => {
                                updateCurrentSet(0, 1);
                            }}
                        >
                            {acceptorName}
                        </button>
                    </div>
                </>
            ) : (
                <div>
                    <div className="fw-semibold lh-sm">{challengerName}</div>
                    <Tooltip content={error || ''} visible={showError} theme="danger" animation={false}>
                        <div className="mt-2 mb-2">
                            <GamePicker
                                name="challengerPoints"
                                value={challengerPoints}
                                onChange={(num) => updateChallengerPoints(num)}
                                showErrors={showError}
                                maxSetPoints={maxSetPoints}
                            />
                        </div>
                    </Tooltip>
                    <div className="mb-2">
                        <GamePicker
                            name="acceptorPoints"
                            value={acceptorPoints}
                            onChange={(num) => updateAcceptorPoints(num)}
                            showErrors={showError}
                            maxSetPoints={maxSetPoints}
                        />
                    </div>
                    <div className="fw-semibold lh-sm">{acceptorName}</div>
                </div>
            )}
        </div>
    );
};

SetForm.propTypes = {
    values: PropTypes.object,
    setValues: PropTypes.func,
    errors: PropTypes.object,
    challengerName: PropTypes.node,
    acceptorName: PropTypes.node,
    goToNextSet: PropTypes.func,
};

SetForm.defaultProps = {};

export default SetForm;
