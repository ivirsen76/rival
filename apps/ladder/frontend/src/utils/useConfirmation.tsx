import { useState, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import style from './useConfirmation.module.scss';

export default () => {
    const [show, setShow] = useState(false);
    const [props, setProps] = useState({});
    const resolve = useRef();

    const handleConfirm = () => {
        setShow(false);
        resolve.current(true);
    };
    const handleCancel = () => {
        setShow(false);
        resolve.current(false);
    };

    const confirm = params => {
        setProps({
            title: 'Are you sure?',
            confirmButtonTitle: 'Yes',
            cancelButtonTitle: 'Cancel',
            ...params,
        });
        setShow(true);

        return new Promise((res, rej) => {
            resolve.current = res;
        });
    };

    return {
        confirm,
        confirmMessage: (
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
        ),
    };
};
