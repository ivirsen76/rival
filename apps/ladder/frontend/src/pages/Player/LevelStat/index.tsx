import { useState } from 'react';
import PropTypes from 'prop-types';
import AngleLeftIcon from '@/styles/metronic/icons/duotone/Navigation/Angle-left.svg?react';
import CupIcon from './cup.svg?react';
import classnames from 'classnames';
import Statbox from '@/components/Statbox';
import Timelines from '../Timelines';
import Modal from '@/components/Modal';
import { Squircle } from 'corner-smoothing';
import style from './style.module.scss';

const LevelStat = (props) => {
    const [expanded, setExpanded] = useState(false);

    const { user } = props;
    const { level, levelSlug, levelType, startSeason, endSeason, seasonsTotal, matches, stages, won, lost, timelines } =
        props.data;

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const seasonsBox = (
        <Statbox
            text={`${seasonsTotal} season${seasonsTotal > 1 ? 's' : ''}`}
            label={
                <span>
                    {startSeason}
                    {endSeason === startSeason ? (
                        ''
                    ) : (
                        <span>
                            {' '}
                            - <span className="text-nowrap">{endSeason}</span>
                        </span>
                    )}
                </span>
            }
            colorHue={202}
            even
        />
    );
    const matchesBox = (
        <Statbox text={`${matches} match${matches === 1 ? '' : 'es'}`} label={`${won} - ${lost}`} colorHue={0} even />
    );

    return (
        <div className={style.levelWrapper}>
            <div
                className="d-flex justify-content-between align-items-center"
                onClick={toggleExpanded}
                style={{ cursor: 'pointer' }}
            >
                <h3 className="lh-sm mt-0 mb-0">
                    {level}{' '}
                    <span className="fw-normal text-muted text-nowrap">
                        ({matches} match{matches === 1 ? '' : 'es'})
                    </span>
                </h3>
                <span
                    className={classnames('svg-icon svg-icon-1 svg-icon-dark', style.toggle, {
                        [style.expanded]: expanded,
                    })}
                >
                    <AngleLeftIcon />
                </span>
            </div>
            {expanded && (
                <div className="mt-4">
                    <div className={style.achievements}>
                        {matches === 0 ? (
                            <>
                                {seasonsBox}
                                {matchesBox}
                            </>
                        ) : (
                            <div className={style.column}>
                                {seasonsBox}
                                {matchesBox}
                            </div>
                        )}

                        {matches > 0 && (
                            <Statbox
                                text="Performance Timelines"
                                colorHue={202}
                                {...(matches > 0
                                    ? {
                                          image: (
                                              <Modal
                                                  title={
                                                      <div className="me-4">
                                                          {user.firstName} {user.lastName} - {level}
                                                          <br />
                                                          Performance Timelines
                                                      </div>
                                                  }
                                                  hasForm={false}
                                                  size="xl"
                                                  backdrop="static"
                                                  dialogClassName={style.timelinesModal}
                                                  bsPrefix={`${style.audoModalWrapper} modal`}
                                                  renderTrigger={({ show }) => (
                                                      <Squircle
                                                          className={style.graph}
                                                          onClick={show}
                                                          data-performance-timeline={levelSlug}
                                                          cornerRadius={10}
                                                      >
                                                          <div className={style.timelinesScreenshot} />
                                                      </Squircle>
                                                  )}
                                                  renderBody={({ hide }) => (
                                                      <Timelines
                                                          data={timelines}
                                                          levelSlug={levelSlug}
                                                          levelType={levelType}
                                                      />
                                                  )}
                                              />
                                          ),
                                      }
                                    : {})}
                                even
                            />
                        )}
                        {stages.quarterfinal > 0 && (
                            <Statbox
                                text="Quarterfinal"
                                label={`${stages.quarterfinal}x`}
                                colorHue={29}
                                even={stages.final === 0 && stages.champion === 0}
                            />
                        )}
                        {stages.semifinal > 0 && (
                            <Statbox
                                text="Semifinal"
                                label={`${stages.semifinal}x`}
                                colorHue={138}
                                even={stages.final === 0 && stages.champion === 0}
                                even1={stages.champion === 0}
                            />
                        )}
                        {stages.final > 0 && <Statbox text="Final" label={`${stages.final}x`} colorHue={235} />}
                        {stages.champion > 0 && (
                            <Statbox
                                text="Champion"
                                label={
                                    <span className={'svg-icon ' + style.trophy}>
                                        {new Array(stages.champion).fill(0).map((_, index) => (
                                            <CupIcon key={index} />
                                        ))}
                                    </span>
                                }
                                colorHue={295}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

LevelStat.propTypes = {
    user: PropTypes.object,
    data: PropTypes.object,
};

export default LevelStat;
