import { createRoot } from 'react-dom/client';
import Alert from './Alert';
import Modal from './Modal';
import style from './style.module.scss';

export default async (options) => {
    if (typeof options === 'string') {
        options = {
            message: options,
        };
    }

    let wrapper = document.getElementById('tl-notification-wrapper');
    if (!wrapper) {
        wrapper = document.body.appendChild(document.createElement('div'));
        wrapper.id = 'tl-notification-wrapper';
        wrapper.className = style.wrapper;
    }

    const target = wrapper.appendChild(document.createElement('div'));
    const root = createRoot(target);

    await new Promise((resolve, reject) => {
        if (options.inModal) {
            root.render(<Modal {...options} cleanup={resolve} />);
        } else {
            root.render(<Alert {...options} onClose={resolve} />);
        }
    });

    root.unmount();
    setTimeout(() => {
        target.remove();
    });
};
