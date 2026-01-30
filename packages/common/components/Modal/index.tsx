import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import _omit from 'lodash/omit';

type ModalComponentProps = {
    title: React.ReactNode;
    renderTrigger: (...args: unknown[]) => unknown;
    renderBody: (...args: unknown[]) => unknown;
    body: React.ReactNode;
    footer: React.ReactNode;
    hasForm: boolean;
};

const ModalComponent = (props: ModalComponentProps) => {
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

ModalComponent.defaultProps = {
    hasForm: true,
};

export default ModalComponent;
