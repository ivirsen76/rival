import pieces from '../pieces';
import Avatar from '@/components/avataaars';
import Modal from '@/components/Modal';
import classnames from 'classnames';
import style from './style.module.scss';

const EmptyIcon = () => <div />;

type PiecePickerProps = {
    form?: object;
    field?: object;
    colors?: object;
    colorField?: string;
};

const PiecePicker = (props: PiecePickerProps) => {
    const { field, form, colors, colorField } = props;
    const piece = pieces[field.name];
    const Icon = pieces[field.name].icon || EmptyIcon;

    const pieceOptions = piece.options;

    return (
        <Modal
            title={piece.title}
            hasForm={false}
            size="lg"
            renderTrigger={({ show }) => (
                <button
                    data-piece={field.name}
                    type="button"
                    className="btn btn-lg btn-secondary btn-icon"
                    onClick={show}
                    title={piece.tooltip || piece.title}
                >
                    <span className="svg-icon svg-icon-2x">
                        <Icon />
                    </span>
                </button>
            )}
            renderBody={({ hide }) => (
                <div>
                    {colors && (
                        <div>
                            <div className={style.colorWrapper}>
                                {pieces[colorField].options.map((option) => (
                                    <div
                                        key={option.value}
                                        className={classnames(style.color, {
                                            [style.selected]: option.value === form.values[colorField],
                                        })}
                                        style={{ background: colors[option.value] }}
                                        onClick={() => {
                                            form.setFieldValue(colorField, option.value);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={style.wrapper}>
                        {pieceOptions.map((option) => (
                            <div
                                key={option.value}
                                data-piece-option={option.value}
                                className={classnames(style.image, { [style.selected]: field.value === option.value })}
                                onClick={() => {
                                    form.setFieldValue(field.name, option.value);
                                    hide();
                                }}
                            >
                                <Avatar
                                    style={{ width: '100%', height: 'auto' }}
                                    avatarStyle="Transparent"
                                    {...form.values}
                                    {...{ [field.name]: option.value }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        />
    );
};

export default PiecePicker;
