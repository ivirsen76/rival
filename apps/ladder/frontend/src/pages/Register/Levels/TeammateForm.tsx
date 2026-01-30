import { useEffect, useMemo, useCallback } from 'react';
import { Formik, Field, Form, useFormikContext } from '@rival/common/components/formik';
import Input from '@rival/common/components/formik/Input';
import Textarea from '@rival/common/components/formik/Textarea';
import PlayerName from '@rival/common/components/PlayerName';
import RadioModern from '@rival/common/components/formik/RadioModern';
import TeamNamePicker, { getValidateTeamName } from '@rival/common/components/formik/TeamNamePicker';
import { useSelector } from 'react-redux';
import useConfig from '@rival/common/utils/useConfig';

type PopulatePartnerNameProps = {
    poolPlayers: unknown[];
};

const PopulatePartnerName = (props: PopulatePartnerNameProps) => {
    const { poolPlayers } = props;
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const player = poolPlayers.find((item) => item.id === values.partnerId);
        if (player) {
            setFieldValue('partnerName', `${player.firstName} ${player.lastName}`);
        }
    }, [poolPlayers, values.partnerId]);

    return null;
};

type TeammateFormProps = {
    tournamentId: number;
    tournaments: unknown[];
    onSubmit: (...args: unknown[]) => unknown;
    hide: (...args: unknown[]) => unknown;
};

const TeammateForm = (props: TeammateFormProps) => {
    const { tournamentId, tournaments, onSubmit, hide } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const config = useConfig();

    const validate = useCallback(
        (values) => {
            const errors = {};

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!values.decision) {
                errors.decision = 'Pick the way to get teammates.';
            } else if (values.decision === 'email') {
                if (!values.email1) {
                    errors.email1 = "Teammate's email is required.";
                } else if (!emailRegex.test(values.email1)) {
                    errors.email1 = 'Wrong email format.';
                } else if (values.email1 === currentUser.email) {
                    errors.email1 = 'You cannot use your email.';
                }

                if (values.email2 && !emailRegex.test(values.email2)) {
                    errors.email2 = 'Wrong email format.';
                } else if (values.email2 === currentUser.email) {
                    errors.email2 = 'You cannot use your email.';
                }
            } else if (values.decision === 'player') {
                if (!values.partnerId) {
                    errors.partnerId = 'You have to pick a player.';
                }
            }

            return errors;
        },
        [currentUser]
    );

    const poolPlayers = useMemo(() => {
        const tournament = tournaments.find((item) => item.tournamentId === tournamentId);
        return tournament.poolPlayers;
    }, [tournamentId, tournaments]);

    const decisionOptions = [
        {
            value: 'email',
            label: 'Invite friends via email',
            description: "Friends don't have to be registered already.",
        },
        {
            value: 'player',
            label: 'Recruit a teammate from the Player Pool',
            description:
                poolPlayers.length === 0
                    ? 'No players available.'
                    : `${poolPlayers.length} player${poolPlayers.length > 1 ? 's are' : ' is'} available now.`,
            disabled: poolPlayers.length === 0,
        },
        {
            value: 'pool',
            label: 'Join the Player Pool',
            description: 'Team Captains can add you from the list of available players.',
        },
    ];

    const playerOptions = poolPlayers.map((item) => ({
        value: item.id,
        label: (
            <div>
                <PlayerName player1={item} /> (
                <a href={`/player/${item.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    Profile
                </a>
                )
            </div>
        ),
        description: item.partnerInfo,
    }));

    return (
        <Formik
            initialValues={{
                decision: null,
                email1: '',
                email2: '',
                partnerId: null,
                partnerName: '',
                teamName: '',
            }}
            onSubmit={onSubmit}
            validate={validate}
        >
            {({ values }) => (
                <Form noValidate>
                    <PopulatePartnerName poolPlayers={poolPlayers} />
                    <div className="text-start">
                        <Field
                            name="decision"
                            label="How do you want to get teammates?"
                            component={RadioModern}
                            options={decisionOptions}
                            alwaysShowDescription
                        />

                        {values.decision === 'email' && (
                            <>
                                <Field
                                    name="email1"
                                    label="Send invites to your friends"
                                    component={Input}
                                    placeholder="Email"
                                    wrapperClassName="mt-3 mb-3"
                                />
                                <Field name="email2" component={Input} placeholder="Additional email (optional)" />
                            </>
                        )}

                        {values.decision === 'player' && (
                            <Field
                                name="partnerId"
                                label="Pick a player"
                                component={RadioModern}
                                options={playerOptions}
                                alwaysShowDescription
                            />
                        )}

                        {values.decision === 'pool' && (
                            <Field
                                name="partnerInfo"
                                label="Additional Information"
                                description="Your level, play availability, preferred location, etc."
                                component={Textarea}
                                maxLength={200}
                            />
                        )}

                        {['email', 'player'].includes(values.decision) && (
                            <Field
                                name="teamName"
                                component={TeamNamePicker}
                                tournamentId={tournamentId}
                                validate={getValidateTeamName(config)}
                            />
                        )}

                        <div className="mt-8">
                            <button type="submit" className="btn btn-primary me-2" disabled={!values.decision}>
                                Submit
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={hide}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default TeammateForm;
