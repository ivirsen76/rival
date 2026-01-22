import FieldWrapper from '../FieldWrapper';
import PlayerName from '@/components/PlayerName';
import PlayerAvatar from '@/components/PlayerAvatar';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import style from './style.module.scss';

type DoublesPlayersPickerProps = {
    form?: object;
    field?: object;
    partners: unknown[];
    label?: React.ReactNode;
};

const DoublesPlayersPicker = (props: DoublesPlayersPickerProps) => {
    const { field, form, partners } = props;
    const showError = form.errors[field.name] && form.submitCount > 0;
    const currentUser = useSelector((state) => state.auth.user);

    const possiblePartners = partners.filter((item) => item.userId !== currentUser.id);

    return (
        <FieldWrapper {...props}>
            <div className={style.team}>
                {possiblePartners.map((partner, index) => {
                    const selected = field.value.includes(partner.id);
                    return (
                        <button
                            key={partner.id}
                            type="button"
                            className={classnames(
                                'btn btn-sm',
                                style.partner,
                                selected ? 'btn-primary' : 'btn-secondary',
                                showError && style.error
                            )}
                            onClick={() => {
                                form.setFieldValue(field.name, [field.value[0], partner.id]);
                            }}
                        >
                            <div className="fs-4">
                                <PlayerAvatar player1={partner} />
                            </div>
                            <PlayerName player1={partner} />
                        </button>
                    );
                })}
            </div>
        </FieldWrapper>
    );
};

DoublesPlayersPicker.defaultProps = {
    label: 'Pick who is going to play with you:',
};

export default DoublesPlayersPicker;
