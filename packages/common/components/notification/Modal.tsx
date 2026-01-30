import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import CheckIcon from '../../metronic/icons/duotune/arrows/arr016.svg?react';

type NotificationModalProps = {
    message: React.ReactNode;
    buttonTitle: string;
    onHide: (...args: unknown[]) => unknown;
    cleanup: (...args: unknown[]) => unknown;
    render: (...args: unknown[]) => unknown;
    title: React.ReactNode;
    modalProps: object;
};

const NotificationModal = (props: NotificationModalProps) => {
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

NotificationModal.defaultProps = {
    buttonTitle: 'Ok, got it!',
};

export default NotificationModal;
