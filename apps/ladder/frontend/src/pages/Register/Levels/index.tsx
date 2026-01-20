import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Checkbox from '@/components/formik/Checkbox';
import FieldWrapper from '@/components/formik/FieldWrapper';
import _intersection from 'lodash/intersection';
import _union from 'lodash/union';
import _xor from 'lodash/xor';
import _difference from 'lodash/difference';
import useConfig from '@/utils/useConfig';
import axios from '@/utils/axios';
import { loadCurrentUser } from '@/reducers/auth';
import { useDispatch } from 'react-redux';
import notification from '@/components/notification';
import { Link, useHistory } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import TermsAndConditions from '@/components/TermsAndConditions';
import { NtrpGuidelinesLink } from '@/components/NtrpGuidelines';
import JoinAnotherLadder from './JoinAnotherLadder';
import getRegisterNotificationProps from '@/utils/getRegisterNotificationProps';
import { getSuitableTournaments } from '@rival/ladder.backend/src/services/tournaments/helpers';
import useStatsigEvents from '@/utils/useStatsigEvents';
import classnames from 'classnames';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import TeammateForm from './TeammateForm';
import useModal from '@/utils/useModal';

const renderTeammateDescription = (tournamentId, values) => {
    const partnerInfo = values.partners[`partner-${tournamentId}`];
    if (!partnerInfo) {
        return null;
    }

    let content;
    if (partnerInfo.decision === 'email') {
        const { email1, email2 } = partnerInfo;

        content = (
            <>
                You&apos;re inviting <span className="text-decoration-underline">{email1}</span>
                {email2 && (
                    <>
                        {' '}
                        and <span className="text-decoration-underline">{email2}</span>
                    </>
                )}
                .
            </>
        );
    } else if (partnerInfo.decision === 'pool') {
        content = 'Joining the Player Pool.';
    } else if (partnerInfo.decision === 'player') {
        content = `You're adding ${partnerInfo.partnerName} from the Player Pool.`;
    }

    if (!content) {
        return null;
    }

    return (
        <div className="text-muted mt-1" style={{ fontSize: '0.9rem' }}>
            {content}
        </div>
    );
};

const Levels = props => {
    const { settings, selectedSeason, updateSettings, onSubmit, user } = props;
    const config = useConfig();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [reasonToJoinAnotherLadder, setReasonToJoinAnotherLadder] = useState(settings.joinReason || '');
    const { onJoiningLadder } = useStatsigEvents();
    const [showTeammateModal, renderTeammateModal] = useModal();
    const history = useHistory();

    // just to not update ladder registered status
    const [savedUser] = useState(user);

    const previousTournaments = Object.values(savedUser.tournaments).filter(
        item => item.seasonId !== selectedSeason.id
    );
    const isNewPlayer = previousTournaments.length === 0;
    const matchesPlayedBefore = previousTournaments.reduce((sum, item) => sum + item.regularMatchesPlayed, 0);
    const notPlayedEnoughToPay = matchesPlayedBefore < config.minMatchesToPay;
    const registerForFree = Boolean(selectedSeason.isFree || isNewPlayer || notPlayedEnoughToPay);

    const {
        userTournaments,
        tournamentOptions,
        tournamentSinglesOptions,
        tournamentDoublesOptions,
        hasSuitableTournament,
        suggestionText,
    } = useMemo(() => {
        const _userTournaments = _intersection(
            Object.values(savedUser.tournaments)
                .filter(item => item.isActive)
                .map(item => item.tournamentId),
            selectedSeason.tournaments.map(t => t.tournamentId)
        );

        const { all, suitable, free, text } = (() => {
            if (!savedUser.establishedElo) {
                return {
                    all: [],
                    suitable: [],
                    free: registerForFree
                        ? []
                        : selectedSeason.tournaments.filter(item => item.isFree).map(item => item.tournamentId),
                    text: '',
                };
            }

            return getSuitableTournaments(
                selectedSeason.tournaments,
                savedUser.establishedElo,
                savedUser.gender,
                registerForFree,
                _userTournaments
            );
        })();

        const _hasSuitableTournament = suitable.length > 0;

        const _tournamentOptions = selectedSeason.tournaments
            .filter(item => {
                if (!savedUser.establishedElo) {
                    return true;
                }
                if (reasonToJoinAnotherLadder) {
                    return true;
                }
                if (all.includes(item.tournamentId)) {
                    return true;
                }
                if (!_hasSuitableTournament) {
                    return true;
                }
                if (_userTournaments.includes(item.tournamentId)) {
                    return true;
                }

                return false;
            })
            .map(item => {
                const alreadyRegistered = _userTournaments.includes(item.tournamentId);
                const isFree = (() => {
                    if (alreadyRegistered || registerForFree) {
                        return false;
                    }
                    if (free.includes(item.tournamentId)) {
                        return true;
                    }
                    return Boolean(item.isFree);
                })();

                return {
                    value: item.tournamentId,
                    label: isFree ? (
                        <div className="d-flex gap-2">
                            <div className="text-nowrap">{item.levelName}</div>
                            <div className="badge badge-warning" data-free-level={item.levelSlug}>
                                Free
                            </div>
                        </div>
                    ) : (
                        item.levelName
                    ),
                    disabled: alreadyRegistered,
                    description: alreadyRegistered ? "You've already registered." : null,
                    isFree,
                    type: item.levelType,
                    maxTlr: item.levelMaxTlr,
                };
            });

        return {
            suggestionText: text.replace(/\[/g, '<span class="text-body">').replace(/\]/g, '</span>'),
            userTournaments: _userTournaments,
            tournamentOptions: _tournamentOptions,
            tournamentSinglesOptions: _tournamentOptions.filter(item => item.type === 'single'),
            tournamentDoublesOptions: _tournamentOptions.filter(item =>
                ['doubles-team', 'doubles'].includes(item.type)
            ),
            hasSuitableTournament: _hasSuitableTournament,
        };
    }, [savedUser, selectedSeason, reasonToJoinAnotherLadder, registerForFree]);

    const initialTournaments = (() => {
        const availableTournaments = selectedSeason.tournaments.map(item => item.tournamentId);
        return _intersection(_union(settings.list, userTournaments), availableTournaments);
    })();

    const initialPartners = tournamentOptions
        .filter(item => item.type === 'doubles-team')
        .reduce((obj, item) => {
            const key = `partner-${item.value}`;
            obj[key] = settings.partners?.[key] || {};
            return obj;
        }, {});

    const validate = values => {
        const errors = {};

        if (!values.agree) {
            errors.agree = 'You must agree with the Terms & Conditions';
        }

        const newTournaments = _difference(values.tournaments, userTournaments);

        if (newTournaments.length === 0) {
            errors.tournaments = 'You have to pick at least one ladder to play.';
        } else if (registerForFree) {
            // Singles
            const hasNewSinglesTournament = newTournaments.some(id =>
                tournamentSinglesOptions.find(item => item.value === id)
            );
            const totalSinglesSelected = tournamentSinglesOptions.filter(item =>
                values.tournaments.includes(item.value)
            ).length;
            if (totalSinglesSelected > 1 && hasNewSinglesTournament) {
                errors.singlesTournaments = 'You cannot pick more than one Singles ladder.';
            }

            // Doubles
            const hasNewDoublesTournament = newTournaments.some(id =>
                tournamentDoublesOptions.find(item => item.value === id)
            );
            const totalDoublesSelected = tournamentDoublesOptions.filter(item =>
                values.tournaments.includes(item.value)
            ).length;
            if (totalDoublesSelected > 1 && hasNewDoublesTournament) {
                errors.doublesTournaments = 'You cannot pick more than one Doubles ladder.';
            }
        } else if (values.tournaments.length > 4) {
            errors.tournaments = 'You cannot pick more than four ladders to play.';
        }

        return errors;
    };

    const isTooHighTlr = option => {
        if (option.type !== 'single') {
            return false;
        }
        if (!savedUser.establishedElo) {
            return false;
        }
        if (!option.maxTlr) {
            return false;
        }

        return savedUser.establishedElo > option.maxTlr;
    };
    const isTooHighTlrDiscount = option => {
        if (!isTooHighTlr(option)) {
            return false;
        }
        if (option.isFree) {
            return false;
        }
        if (registerForFree) {
            return false;
        }

        return true;
    };

    const renderTlrWarning = option => {
        if (!isTooHighTlr(option)) {
            return null;
        }

        const showDiscountInfo = isTooHighTlrDiscount(option);

        return (
            <div className="alert alert-warning pt-2 pb-2 mt-1">
                Your <b>TLR {formatElo(savedUser.establishedElo)}</b> is too high for this level. You can still play in
                the regular season, but you won&apos;t be able to play in the Final Tournament.
                {showDiscountInfo && (
                    <div className="mt-2">
                        You will receive a <b>${config.tooHighTlrDiscount / 100}</b> discount due to this limitation.
                    </div>
                )}
            </div>
        );
    };

    const renderTournamentOption = ({ field, form, values, option }) => (
        <div
            key={option.value}
            className={classnames('form-check form-check-solid mb-2', {
                'is-invalid': form.errors[field.name] && form.submitCount > 0,
            })}
        >
            <label className={classnames('form-check-label', option.disabled && 'text-muted')}>
                <input
                    type="checkbox"
                    name={field.name}
                    value={option.value}
                    checked={field.value.includes(option.value)}
                    className="form-check-input"
                    onChange={() => {
                        if (option.type === 'doubles-team' && !field.value.includes(option.value)) {
                            showTeammateModal(option.value);
                        } else {
                            form.setFieldValue(field.name, _xor(field.value, [option.value]));
                        }
                    }}
                    disabled={option.disabled}
                />
                {option.label}
                {option.description && <span className="ms-2">({option.description})</span>}
                {option.type === 'doubles-team' &&
                    field.value.includes(option.value) &&
                    renderTeammateDescription(option.value, values)}
            </label>
            {field.value.includes(option.value) && !option.disabled && renderTlrWarning(option)}
        </div>
    );

    const guidanceText =
        hasSuitableTournament && !reasonToJoinAnotherLadder ? (
            <div>
                <div dangerouslySetInnerHTML={{ __html: suggestionText }} />
                {!user.isSoftBan && (
                    <div>
                        <Modal
                            title="Join Another Ladder"
                            renderTrigger={({ show }) => (
                                <a
                                    href=""
                                    onClick={e => {
                                        e.preventDefault();
                                        show();
                                    }}
                                >
                                    Have a strong reason to join another ladder?
                                </a>
                            )}
                            renderBody={({ hide }) => (
                                <JoinAnotherLadder
                                    initialReason={reasonToJoinAnotherLadder}
                                    onSubmit={reason => {
                                        setReasonToJoinAnotherLadder(reason);
                                        hide();
                                    }}
                                />
                            )}
                        />
                    </div>
                )}
            </div>
        ) : (
            <div>
                Use the <NtrpGuidelinesLink /> to determine your level. You can change ladder later if you find it not
                suitable for your level.
            </div>
        );

    return (
        <Formik
            initialValues={{ tournaments: initialTournaments, partners: initialPartners }}
            validate={validate}
            onSubmit={async values => {
                if (registerForFree) {
                    await axios.put('/api/players/0', {
                        action: 'registerForFree',
                        tournaments: values.tournaments,
                        partners: values.partners,
                        joinReason: reasonToJoinAnotherLadder,
                    });
                    await dispatch(loadCurrentUser());
                    await queryClient.invalidateQueries();

                    const selectedLevel = selectedSeason.tournaments.find(
                        item =>
                            values.tournaments.includes(item.tournamentId) &&
                            !userTournaments.includes(item.tournamentId)
                    );
                    const url = `/season/${selectedSeason.year}/${selectedSeason.season}/${selectedLevel.levelSlug}`;
                    history.push(url);

                    notification({
                        inModal: true,
                        ...getRegisterNotificationProps({
                            message: 'You are successfully registered!',
                            buttonTitle: 'Go to the Ladder',
                            ladderUrl: url,
                            season: selectedSeason,
                        }),
                    });
                    onJoiningLadder();
                } else {
                    const list = _difference(values.tournaments, userTournaments);

                    updateSettings({
                        list,
                        joinForFree: tournamentOptions
                            .filter(item => item.isFree && list.includes(item.value))
                            .map(item => item.value),
                        joinReason: reasonToJoinAnotherLadder,
                        partners: values.partners,
                    });
                    onSubmit();
                }
            }}
        >
            {({ isSubmitting, values, setFieldValue, errors }) => (
                <Form noValidate>
                    {renderTeammateModal({
                        title: 'Getting Teammates',
                        renderBody: ({ hide, param: tournamentId }) => (
                            <TeammateForm
                                tournamentId={tournamentId}
                                tournaments={selectedSeason.tournaments}
                                hide={hide}
                                onSubmit={data => {
                                    hide();
                                    setFieldValue('tournaments', _xor(values.tournaments, [tournamentId]));
                                    setFieldValue(`partners.partner-${tournamentId}`, data);
                                }}
                            />
                        ),
                        modalProps: {
                            backdrop: 'static',
                        },
                    })}
                    {(() => {
                        if (selectedSeason.isFree) {
                            return (
                                <div className="alert alert-primary">
                                    This season is <strong>FREE</strong> as we continue to build the community to over
                                    150 active players. <Link to="/pricing">Learn more.</Link>
                                </div>
                            );
                        }

                        if (isNewPlayer) {
                            return (
                                <div className="alert alert-primary">
                                    Play your first season for <strong>FREE</strong>!
                                </div>
                            );
                        }

                        if (notPlayedEnoughToPay) {
                            return (
                                <div className="alert alert-primary">
                                    You can join this season for <strong>FREE</strong> because you played fewer than{' '}
                                    {config.minMatchesToPay} matches before this season.
                                </div>
                            );
                        }

                        return (
                            <div className="alert alert-primary">
                                <div className="mb-2">
                                    Prices {selectedSeason.isEarlyRegistration ? 'before' : 'after'} the season starts:
                                </div>
                                Singles - <strong>${selectedSeason.singlesCost / 100}</strong> per ladder
                                <br />
                                Doubles - <strong>${selectedSeason.doublesCost / 100}</strong> per ladder
                                <div className="mt-2">
                                    <b>$10 discount</b> when you register for an additional ladder.
                                </div>
                            </div>
                        );
                    })()}
                    {registerForFree ? (
                        <Field name="tournaments">
                            {({ field, form }) => (
                                <FieldWrapper field={field} form={form}>
                                    <>
                                        <div className="mb-6">{guidanceText}</div>

                                        <div className="d-grid gap-6">
                                            {tournamentSinglesOptions.length > 0 && (
                                                <div>
                                                    <div className="form-label">
                                                        Pick one Singles ladder (or skip for now)
                                                    </div>
                                                    {tournamentSinglesOptions.map(option =>
                                                        renderTournamentOption({ field, form, values, option })
                                                    )}
                                                    {form.submitCount > 0 && errors.singlesTournaments ? (
                                                        <div className="text-danger">{errors.singlesTournaments}</div>
                                                    ) : null}
                                                </div>
                                            )}
                                            {tournamentDoublesOptions.length > 0 && (
                                                <div>
                                                    <div className="form-label">
                                                        Pick one Doubles ladder (or skip for now)
                                                    </div>
                                                    {tournamentDoublesOptions.map(option =>
                                                        renderTournamentOption({ field, form, values, option })
                                                    )}
                                                    {form.submitCount > 0 && errors.doublesTournaments ? (
                                                        <div className="text-danger">{errors.doublesTournaments}</div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                </FieldWrapper>
                            )}
                        </Field>
                    ) : (
                        <Field name="tournaments">
                            {({ field, form }) => (
                                <FieldWrapper
                                    label="Choose ladders to play:"
                                    field={field}
                                    form={form}
                                    description={guidanceText}
                                >
                                    {tournamentOptions.map(option =>
                                        renderTournamentOption({ field, form, values, option })
                                    )}
                                </FieldWrapper>
                            )}
                        </Field>
                    )}

                    <div className="form-label">Terms & Conditions</div>
                    <Field
                        name="agree"
                        label={
                            <span>
                                I agree with the{' '}
                                <Modal
                                    title="Terms & Conditions"
                                    renderTrigger={({ show }) => (
                                        <a
                                            href=""
                                            onClick={e => {
                                                e.preventDefault();
                                                show();
                                            }}
                                        >
                                            Terms & Conditions
                                        </a>
                                    )}
                                    renderBody={({ hide }) => (
                                        <div>
                                            <TermsAndConditions />
                                            <button type="button" className="btn btn-secondary" onClick={hide}>
                                                Close
                                            </button>
                                        </div>
                                    )}
                                    size="lg"
                                />
                                .
                            </span>
                        }
                        component={Checkbox}
                    />

                    <Button className="btn btn-primary" isSubmitting={isSubmitting}>
                        {registerForFree ? 'Register' : 'Go to checkout'}
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

Levels.propTypes = {
    settings: PropTypes.object,
    updateSettings: PropTypes.func,
    onSubmit: PropTypes.func,
    user: PropTypes.object,
    selectedSeason: PropTypes.object,
};

export default Levels;
