import PropTypes from 'prop-types';

const Counter = props => {
    const { field, form, min, max } = props;

    return (
        <div className="input-group">
            <button
                className="btn btn-outline btn-outline-dashed btn-outline-primary btn-active-light-primary"
                style={{ width: '33%', paddingLeft: 0, paddingRight: 0 }}
                type="button"
                onClick={() => {
                    if (field.value > min) {
                        form.setFieldValue(field.name, field.value - 1);
                    }
                }}
            >
                -
            </button>
            <input
                className="form-control text-center btn btn-primary"
                style={{ width: '34%', paddingLeft: 0, paddingRight: 0 }}
                value={field.value}
                onChange={() => {}}
            />
            <button
                className="btn btn-outline btn-outline-dashed btn-outline-primary btn-active-light-primary"
                style={{ width: '33%', paddingLeft: 0, paddingRight: 0 }}
                type="button"
                onClick={() => {
                    if (field.value < max) {
                        form.setFieldValue(field.name, field.value + 1);
                    }
                }}
            >
                +
            </button>
        </div>
    );
};

Counter.propTypes = {
    form: PropTypes.object,
    field: PropTypes.object,
    min: PropTypes.number,
    max: PropTypes.number,
};

Counter.defaultProps = {
    min: 0,
    max: 99,
};

export default Counter;
