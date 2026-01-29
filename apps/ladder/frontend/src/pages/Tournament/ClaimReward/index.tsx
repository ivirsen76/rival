import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import notification from '@/components/notification';
import { Formik, Field, Form } from '@/components/formik';
import Input from '@/components/formik/Input';
import AddressAutocomplete from '@/components/formik/AddressAutocomplete';
import obfuscateLabel from '@rival/packages/utils/obfuscateLabel';
import Select from '@/components/formik/Select';
import Button from '@rival/packages/components/Button';
import useConfig from '@/utils/useConfig';
import dayjs from '@/utils/dayjs';
import style from './style.module.scss';

const stateOptions = [
    { value: 'AL', label: 'AL' },
    { value: 'AK', label: 'AK' },
    { value: 'AZ', label: 'AZ' },
    { value: 'AR', label: 'AR' },
    { value: 'CA', label: 'CA' },
    { value: 'CO', label: 'CO' },
    { value: 'CT', label: 'CT' },
    { value: 'DE', label: 'DE' },
    { value: 'DC', label: 'DC' },
    { value: 'FL', label: 'FL' },
    { value: 'GA', label: 'GA' },
    { value: 'HI', label: 'HI' },
    { value: 'ID', label: 'ID' },
    { value: 'IL', label: 'IL' },
    { value: 'IN', label: 'IN' },
    { value: 'IA', label: 'IA' },
    { value: 'KS', label: 'KS' },
    { value: 'KY', label: 'KY' },
    { value: 'LA', label: 'LA' },
    { value: 'ME', label: 'ME' },
    { value: 'MD', label: 'MD' },
    { value: 'MA', label: 'MA' },
    { value: 'MI', label: 'MI' },
    { value: 'MN', label: 'MN' },
    { value: 'MS', label: 'MS' },
    { value: 'MO', label: 'MO' },
    { value: 'MT', label: 'MT' },
    { value: 'NE', label: 'NE' },
    { value: 'NV', label: 'NV' },
    { value: 'NH', label: 'NH' },
    { value: 'NJ', label: 'NJ' },
    { value: 'NM', label: 'NM' },
    { value: 'NY', label: 'NY' },
    { value: 'NC', label: 'NC' },
    { value: 'ND', label: 'ND' },
    { value: 'OH', label: 'OH' },
    { value: 'OK', label: 'OK' },
    { value: 'OR', label: 'OR' },
    { value: 'PA', label: 'PA' },
    { value: 'RI', label: 'RI' },
    { value: 'SC', label: 'SC' },
    { value: 'SD', label: 'SD' },
    { value: 'TN', label: 'TN' },
    { value: 'TX', label: 'TX' },
    { value: 'UT', label: 'UT' },
    { value: 'VT', label: 'VT' },
    { value: 'VA', label: 'VA' },
    { value: 'WA', label: 'WA' },
    { value: 'WV', label: 'WV' },
    { value: 'WI', label: 'WI' },
    { value: 'WY', label: 'WY' },
];

type FormItselfProps = {
    setFieldValue: (...args: unknown[]) => unknown;
    isChampion: boolean;
    isSubmitting: boolean;
    handleSubmit: (...args: unknown[]) => unknown;
    prize: number;
    prizeAsCredit: number;
    tournament: object;
    trophyAvailabilityDate: string;
};

const FormItself = (props: FormItselfProps) => {
    const {
        setFieldValue,
        isSubmitting,
        isChampion,
        handleSubmit,
        prize,
        prizeAsCredit,
        tournament,
        trophyAvailabilityDate,
    } = props;

    const config = useConfig();
    const currentUser = useSelector((state) => state.auth.user);
    const { playerId } = currentUser.tournaments[tournament.id];
    const currentPlayer = tournament.players[playerId];
    const isDoublesTeam = tournament.levelType === 'doubles-team';

    const onAddressAutocomplete = (address) => {
        setFieldValue('locationPrimary', address.line_1);
        setFieldValue('locationExtra', address.line_2);
        setFieldValue('regionLocal', address.city);
        setFieldValue('sectorCode', address.state_abbreviation.toUpperCase());
        setFieldValue('regionIndex', address.zip_code);
    };

    const title = isDoublesTeam
        ? `Congratulations, ${currentPlayer.partners?.[0].teamName}!`
        : isChampion
          ? 'Congratulations, Champion!'
          : 'Congratulations, Runner-Up!';

    const rewardTypeOptions = [
        {
            value: 'credit',
            label: (
                <span>
                    <b>${prizeAsCredit}</b> Rival Credit (Most Popular - ${config.creditRewardBonus / 100} Bonus!)
                </span>
            ),
        },
        {
            value: 'gift',
            label: (
                <span>
                    <b>${prize}</b> Gift Card from Tennis Warehouse
                </span>
            ),
        },
    ];

    return (
        <div className={style.wrapper} data-claim-award>
            <h3>{title}</h3>
            <div className={style.trophy} />
            <div className={style.form}>
                {(() => {
                    if (isDoublesTeam) {
                        return (
                            <p>
                                As the Doubles Champions, every person on your team who played at least one match will
                                be receiving <b>${prize} credit</b> and an <b>engraved trophy</b>!{' '}
                                {config.isRaleigh ? (
                                    <span>
                                        You can pick up your team&apos;s trophies at Millbrook Exchange Tennis Center
                                        after <b>{trophyAvailabilityDate}</b>.
                                    </span>
                                ) : (
                                    `Fill in the following form, and we'll send the trophies to you to share with your team:`
                                )}
                            </p>
                        );
                    }

                    return isChampion ? (
                        <p>
                            As the champion, you&apos;ll be receiving a <b>gift card</b> and an <b>engraved Trophy</b>!{' '}
                            {config.isRaleigh ? (
                                <span>
                                    You can pick up your trophy at Millbrook Exchange Tennis Center after{' '}
                                    <b>{trophyAvailabilityDate}</b>.
                                </span>
                            ) : (
                                `Fill in the following address form, and we'll send the trophy straight to your home!`
                            )}
                        </p>
                    ) : (
                        <p>
                            As the runner-up, you&apos;ll be receiving
                            {prize > 0 ? (
                                <>
                                    {' '}
                                    a <b>gift card</b> and
                                </>
                            ) : null}{' '}
                            an <b>engraved trophy</b>!{' '}
                            {config.isRaleigh ? (
                                <span>
                                    You can pick up your trophy at Millbrook Exchange Tennis Center after{' '}
                                    <b>{trophyAvailabilityDate}</b>.
                                </span>
                            ) : (
                                `Fill in the following address form, and we'll send the trophy straight to your home!`
                            )}
                        </p>
                    );
                })()}
                {prize > 0 && !isDoublesTeam && (
                    <Field
                        name="rewardType"
                        render={({ field }) => (
                            <div className="mb-4">
                                <label className="form-label">Choose your preferred award:</label>
                                <div>
                                    {rewardTypeOptions.map((item) => (
                                        <div key={item.value} className="form-check form-check-solid mb-2">
                                            <label className="form-check-label">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name={field.name}
                                                    value={item.value}
                                                    onChange={() => setFieldValue(field.name, item.value)}
                                                    checked={field.value === item.value}
                                                />
                                                {item.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    />
                )}
                {!config.isRaleigh && (
                    <div className={style.address}>
                        <div className={style.address1}>
                            <Field
                                name="locationPrimary"
                                label={obfuscateLabel('Street address:')}
                                component={AddressAutocomplete}
                                onAutocomplete={onAddressAutocomplete}
                            />
                            <Field name="locationExtra" label={obfuscateLabel('Apt, suite:')} component={Input} />
                        </div>
                        <div className={style.address2}>
                            <Field name="regionLocal" label={obfuscateLabel('City:')} component={Input} />
                            <Field
                                name="sectorCode"
                                label={obfuscateLabel('State:')}
                                component={Select}
                                options={stateOptions}
                            />
                            <Field name="regionIndex" label={obfuscateLabel('ZIP:')} component={Input} />
                        </div>
                    </div>
                )}
                <Button type="button" isSubmitting={isSubmitting} onClick={handleSubmit}>
                    Claim reward
                </Button>
            </div>
        </div>
    );
};

type ClaimRewardProps = {
    reloadTournament: (...args: unknown[]) => unknown;
    isChampion: boolean;
    tournament: object;
};

const ClaimReward = (props: ClaimRewardProps) => {
    const { isChampion, tournament, reloadTournament } = props;
    const currentUser = useSelector((state) => state.auth.user);
    const { playerId } = currentUser.tournaments[tournament.id];
    const config = useConfig();

    const isFree = tournament.seasonIsFree === 1;
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const prize = (() => {
        if (isDoublesTeam) {
            return config.doublesChampionReward / 100;
        }
        if (isFree) {
            return isChampion ? config.singlesChampionReward / 100 / 2 : 0;
        }

        return isChampion ? config.singlesChampionReward / 100 : config.singlesRunnerUpReward / 100;
    })();
    const prizeAsCredit = prize + config.creditRewardBonus / 100;
    const trophyAvailabilityDate = dayjs.tz(tournament.endDate).add(16.5, 'day').format('MMMM D');

    const onSubmit = async (values) => {
        await axios.put(`/api/players/${playerId}`, {
            action: 'claimReward',
            address: config.isRaleigh
                ? '-'
                : [
                      `${values.locationPrimary}${values.locationExtra ? ` ${values.locationExtra}` : ''}`,
                      values.regionLocal,
                      values.sectorCode,
                      values.regionIndex,
                  ]
                      .map((item) => item.replace(/,/g, '').trim())
                      .join(', ')
                      .replace(/\s+/g, ' '),
            rewardType: values.rewardType,
        });
        await reloadTournament();

        const trophyInstructions = config.isRaleigh ? (
            <div key="trophyInstructionRaleigh">
                You can pick up your {isDoublesTeam ? "team's trophies" : 'trophy'} at Millbrook Exchange Tennis Center
                after <b>{trophyAvailabilityDate}</b>.
            </div>
        ) : (
            <div key="trophyInstruction">
                You&apos;ll receive your {isDoublesTeam ? "team's trophies" : 'trophy'} in <b>2-3 weeks</b>.
            </div>
        );

        const messages = [<div key="congratulations">Congratulations!</div>];
        if (isDoublesTeam) {
            messages.push(
                <div key="teamCredit">
                    We&apos;ve awarded every teammate who played at least one match <b>${prize} credit</b>.
                </div>
            );
            messages.push(trophyInstructions);
        } else if (values.rewardType === 'gift') {
            if (config.isRaleigh) {
                messages.push(
                    <div key="giftCardRaleigh">
                        Your digital gift card will arrive to your email within the <b>next 24 hours</b>.
                    </div>
                );
                messages.push(trophyInstructions);
            } else {
                messages.push(
                    <div key="giftCardAndTrophy">
                        You&apos;ll receive your trophy and gift card in <b>2-3 weeks</b>.
                    </div>
                );
            }
        } else {
            if (prize > 0) {
                messages.push(
                    <div key="credit">
                        You&apos;ve received a <b>${prizeAsCredit} credit</b> to your{' '}
                        <a href="/user/wallet">Rival Wallet</a>.
                    </div>
                );
            }
            messages.push(trophyInstructions);
        }

        notification({
            inModal: true,
            message: (
                <div className="d-grid gap-2" style={{ textWrap: 'balance' }}>
                    {messages}
                </div>
            ),
        });
    };

    const validate = (values) => {
        const errors = {};

        if (!config.isRaleigh) {
            if (!values.locationPrimary) {
                errors.locationPrimary = 'Address is required';
            }

            if (!values.regionLocal) {
                errors.regionLocal = 'City is required';
            }

            if (!values.regionIndex) {
                errors.regionIndex = 'Zip code is required';
            } else if (!/^\d{5}$/.test(values.regionIndex)) {
                errors.regionIndex = 'Zip code is incorrect';
            }
        }

        return errors;
    };

    return (
        <Formik
            initialValues={{
                locationPrimary: '',
                locationExtra: '',
                regionLocal: '',
                sectorCode: config.state,
                regionIndex: '',
                rewardType: 'credit',
            }}
            validate={validate}
            onSubmit={onSubmit}
        >
            {({ isSubmitting, setFieldValue, handleSubmit }) => (
                <Form noValidate>
                    <FormItself
                        setFieldValue={setFieldValue}
                        isChampion={isChampion}
                        isSubmitting={isSubmitting}
                        handleSubmit={handleSubmit}
                        prize={prize}
                        prizeAsCredit={prizeAsCredit}
                        tournament={tournament}
                        trophyAvailabilityDate={trophyAvailabilityDate}
                    />
                </Form>
            )}
        </Formik>
    );
};

export default ClaimReward;
