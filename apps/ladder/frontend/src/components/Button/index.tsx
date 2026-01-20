import PropTypes from 'prop-types';
import _omit from 'lodash/omit';

const Button = props => {
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

Button.propTypes = {
    type: PropTypes.string,
    isSubmitting: PropTypes.bool,
    disabled: PropTypes.bool,
    submittingTitle: PropTypes.node,
    children: PropTypes.node,
};

Button.defaultProps = {
    type: 'submit',
};

export default Button;
