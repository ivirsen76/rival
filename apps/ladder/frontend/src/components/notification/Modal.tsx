import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import CheckIcon from '@rival/packages/metronic/icons/duotune/arrows/arr016.svg?react';

const NotificationModal = (props) => {
    const [visible, setVisible] = useState(true);

    const hide = () => {
        setVisible(false);

        if (props.onHide) {
            props.onHide();
        }

        // Let modal to show closing animation
        setTimeout(props.cleanup, 1000);
    };

    return (
        <Modal
            show={visible}
            onHide={hide}
            centered
            backdrop="static"
            keyboard={false}
            contentClassName="text-center"
            {...props.modalProps}
        >
            {props.title && (
                <Modal.Header closeButton>
                    <Modal.Title>{props.title}</Modal.Title>
                </Modal.Header>
            )}
            <Modal.Body>
                {props.render ? (
                    props.render({ hide })
                ) : (
                    <>
                        <span className="svg-icon svg-icon-success svg-icon-5x">
                            <CheckIcon />
                        </span>
                        <div className="mt-6 mb-8">{props.message}</div>
                        <button type="button" className="btn btn-primary" onClick={hide}>
                            {props.buttonTitle}
                        </button>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

NotificationModal.propTypes = {
    message: PropTypes.node,
    buttonTitle: PropTypes.string,
    onHide: PropTypes.func,
    cleanup: PropTypes.func,
    render: PropTypes.func,
    title: PropTypes.node,
    modalProps: PropTypes.object,
};

NotificationModal.defaultProps = {
    buttonTitle: 'Ok, got it!',
};

export default NotificationModal;
