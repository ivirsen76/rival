import Loader from '@/components/Loader';
import { createRoot } from 'react-dom/client';

let isReloading = false;

const div = document.createElement('div');
document.body.appendChild(div);

const reload = async () => {
    if (isReloading) {
        return;
    }

    isReloading = true;

    const root = createRoot(div);
    root.render(<Loader loading />);

    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
};

export default reload;
