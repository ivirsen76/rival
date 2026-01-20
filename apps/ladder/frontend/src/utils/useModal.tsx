import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

export default () => {
    const [visible, setVisible] = useState(false);
    const [param, setParam] = useState(null);

    const show = (value) => {
        setParam(value);
        setVisible(true);
    };
    const hide = () => setVisible(false);

    const render = ({ title, renderBody, modalProps }) => {
        return (
            <Modal {...modalProps} show={visible} onHide={hide}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{visible ? renderBody({ hide, param }) : null}</Modal.Body>
            </Modal>
        );
    };

    return [show, render];
};
