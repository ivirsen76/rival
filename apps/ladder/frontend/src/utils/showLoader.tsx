import { createRoot } from 'react-dom/client';
import Loader from '@rival/packages/components/Loader';

// Add div to the body where we will render the confirm modal
const wrapper = document.createElement('div');
document.body.appendChild(wrapper);

export default async (func) => {
    const root = createRoot(wrapper);
    root.render(<Loader loading />);

    try {
        await func();
    } catch (error) {
        root.unmount();
        throw error;
    }

    root.unmount();
};
