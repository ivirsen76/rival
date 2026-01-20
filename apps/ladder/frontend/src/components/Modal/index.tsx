import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import _omit from 'lodash/omit';

const ModalComponent = props => {
    const [visible, setVisible] = useState(false);

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    const passingProps = _omit(props, [
        'title',
        'renderTrigger',
        'renderBody',
        'body',
        'footer',
        'children',
        'hasForm',
    ]);

    return (
        <>
            {props.renderTrigger({ show, hide })}
            <Modal {...passingProps} show={visible} onHide={hide}>
                <Modal.Header closeButton>
                    <Modal.Title>{props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {visible ? (props.renderBody ? props.renderBody({ show, hide }) : props.body) : null}
                </Modal.Body>
                {props.footer && <Modal.Footer>{props.footer}</Modal.Footer>}
            </Modal>
        </>
    );
};

ModalComponent.propTypes = {
    title: PropTypes.node,
    renderTrigger: PropTypes.func.isRequired,
    renderBody: PropTypes.func,
    body: PropTypes.node,
    footer: PropTypes.node,
    hasForm: PropTypes.bool,
};

ModalComponent.defaultProps = {
    hasForm: true,
};

export default ModalComponent;
