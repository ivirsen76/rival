import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-bootstrap/Modal';
import style from './confirmation.module.scss';

// Add div to the body where we will render the confirm modal
const wrapper = document.createElement('div');
document.body.appendChild(wrapper);

type ConfirmModalProps = {
    title: string;
    message: string | React.ReactNode;
    confirmButtonTitle: string;
    cancelButtonTitle: string;
    resolve: (...args: unknown[]) => unknown;
    reject: (...args: unknown[]) => unknown;
};

const ConfirmModal = (props: ConfirmModalProps) => {
    const [show, setShow] = useState(true);

    const handleConfirm = () => {
        setShow(false);
        props.resolve(true);
    };
    const handleCancel = () => {
        setShow(false);
        props.reject(false);
    };

    return (
        <Modal
            show={show}
            backdrop="static"
            keyboard={false}
            backdropClassName={style.backdrop}
            dialogClassName="tl-confirmation"
        >
            <Modal.Header>
                <Modal.Title>{props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{props.message}</Modal.Body>
            <Modal.Footer bsPrefix="modal-footer justify-content-start">
                <button className="btn btn-primary" type="button" onClick={handleConfirm}>
                    {props.confirmButtonTitle}
                </button>
                <button className="btn btn-secondary" type="button" onClick={handleCancel}>
                    {props.cancelButtonTitle}
                </button>
            </Modal.Footer>
        </Modal>
    );
};

ConfirmModal.defaultProps = {
    title: 'Are you sure?',
    confirmButtonTitle: 'Yes',
    cancelButtonTitle: 'Cancel',
};

export default async (options) => {
    if (typeof options === 'string') {
        options = {
            message: options,
        };
    }

    let result = true;
    const root = createRoot(wrapper);
    try {
        await new Promise((resolve, reject) => {
            root.render(<ConfirmModal {...options} reject={reject} resolve={resolve} />);
        });
    } catch (e) {
        result = false;
    }

    // Just to wait for animation done
    setTimeout(() => {
        root.unmount();
    }, 1000);

    return result;
};
