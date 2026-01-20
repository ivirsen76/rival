import { useSelector } from 'react-redux';

export default () => {
    const user = useSelector(state => state.auth.user);

    return user?.appearance || 'light';
};
