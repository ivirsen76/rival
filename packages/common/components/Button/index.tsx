import _omit from 'lodash/omit';

type ButtonProps = {
    type?: string;
    isSubmitting: boolean;
    disabled?: boolean;
    submittingTitle?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

const Button = (props: ButtonProps) => {
    const passingProps = _omit(props, ['isSubmitting', 'children', 'submittingTitle']);

    return (
        <button
            type={props.type}
            className="btn btn-primary"
            {...passingProps}
            disabled={props.isSubmitting || props.disabled}
        >
            {props.isSubmitting && <span className="spinner-border spinner-border-sm align-middle me-2" />}
            {props.isSubmitting && props.submittingTitle ? props.submittingTitle : props.children}
        </button>
    );
};

Button.defaultProps = {
    type: 'submit',
};

export default Button;
