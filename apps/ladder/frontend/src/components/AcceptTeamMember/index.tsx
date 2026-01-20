import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import notification from '@/components/notification';
import axios from '@/utils/axios';

const AcceptTeamMember = (props) => {
    const history = useHistory();

    useEffect(() => {
        (async () => {
            const response = await axios.put('/api/teams/0', {
                action: 'acceptMemberByLink',
                payload: props.payload,
            });
            const { path, playerName } = response.data;

            history.push(path);

            notification({
                inModal: true,
                message: `${playerName} joined your team!`,
            });
        })();
    }, []);

    return null;
};

AcceptTeamMember.propTypes = {
    payload: PropTypes.string,
};

export default AcceptTeamMember;
