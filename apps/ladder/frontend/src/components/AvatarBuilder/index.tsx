import { useRef } from 'react';
import Avatar from '@/components/avataaars';
import { Formik, Field, Form } from '@/components/formik';
import Button from '@/components/Button';
import PiecePicker from './PiecePicker';
import Random from './Random';
import Modal from '@/components/Modal';
import style from './style.module.scss';
import { colors as hairColors } from '@/components/avataaars/avatar/top/HairColor';
import { colors as beardColors } from '@/components/avataaars/avatar/top/facialHair/Colors';
import { colors as clothColors } from '@/components/avataaars/avatar/clothes/Colors';

type AvatarBuilderProps = {
    initialValues: object;
    onSubmit: (...args: unknown[]) => unknown;
    onCancel: (...args: unknown[]) => unknown;
    isWoman: boolean;
};

const AvatarBuilder = (props: AvatarBuilderProps) => {
    const avatar = useRef();

    const initialValues = {
        topType: props.isWoman ? 'LongHairStraight2' : 'ShortHairShortCurly',
        accessoriesType: 'Blank',
        hairColor: 'BrownDark',
        facialHairType: 'Blank',
        clotheType: props.isWoman ? 'Overall' : 'Hoodie',
        clotheColor: props.isWoman ? 'Red' : 'PastelBlue',
        eyeType: 'Default',
        eyebrowType: 'Default',
        mouthType: 'Smile',
        skinColor: 'Light',
        ...props.initialValues,
    };

    const onSubmit = async (values) => {
        await props.onSubmit({
            avatarObject: JSON.stringify(values),
            avatar: avatar.current.firstChild.outerHTML,
        });
    };

    return (
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
            {({ values, isSubmitting, setValues }) => (
                <Form noValidate>
                    <div className={style.wrapper}>
                        <div>
                            <div className={style.preview} ref={avatar}>
                                <Avatar
                                    avatarStyle="Transparent"
                                    topType="LongHairMiaWallace"
                                    accessoriesType="Prescription02"
                                    hairColor="BrownDark"
                                    facialHairType="Blank"
                                    clotheType="Hoodie"
                                    clotheColor="PastelBlue"
                                    eyeType="Happy"
                                    eyebrowType="Default"
                                    mouthType="Smile"
                                    skinColor="Light"
                                    {...values}
                                />
                            </div>
                        </div>
                        <div>
                            <div className={style.buttons}>
                                <Field
                                    name="topType"
                                    component={PiecePicker}
                                    colors={hairColors}
                                    colorField="hairColor"
                                />
                                <Field name="accessoriesType" component={PiecePicker} />
                                <Field
                                    name="facialHairType"
                                    component={PiecePicker}
                                    colors={beardColors}
                                    colorField="facialHairColor"
                                />
                                <Field
                                    name="clotheType"
                                    component={PiecePicker}
                                    colors={clothColors}
                                    colorField="clotheColor"
                                />
                                <Field name="eyeType" component={PiecePicker} />
                                <Field name="eyebrowType" component={PiecePicker} />
                                <Field name="mouthType" component={PiecePicker} />
                                <Field name="skinColor" component={PiecePicker} />
                            </div>
                            <Modal
                                title="Random avatar"
                                hasForm={false}
                                size="lg"
                                renderTrigger={({ show }) => (
                                    <button type="button" className="btn btn-secondary" onClick={show}>
                                        Generate random
                                    </button>
                                )}
                                renderBody={({ hide }) => (
                                    <Random
                                        setValues={(obj) => {
                                            setValues(obj);
                                            hide();
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className={style.modalButtons}>
                        <Button isSubmitting={isSubmitting}>Save</Button>
                        {props.onCancel && (
                            <button type="button" className="btn btn-light ms-2" onClick={props.onCancel}>
                                Cancel
                            </button>
                        )}
                    </div>
                </Form>
            )}
        </Formik>
    );
};

AvatarBuilder.defaultProps = {
    isWoman: false,
};

export default AvatarBuilder;
