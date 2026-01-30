import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import notification from '@rival/common/components/notification';
import axios from '@rival/common/axios';

type AcceptTeamMemberProps = {
    payload: string;
};

const AcceptTeamMember = (props: AcceptTeamMemberProps) => {
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

export default AcceptTeamMember;
