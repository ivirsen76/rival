import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import notification from '@/components/notification';
import axios from '@/utils/axios';

type AcceptTeamMemberProps = {
    payload?: string;
};

const AcceptTeamMember = (props: AcceptTeamMemberProps) => {
    const history = useHistory();

    useEffect(() => {
        (async () => {
            const response = await axios.put('/api/teams/0', {
                action: 'joinTeamByLink',
                payload: props.payload,
            });
            const { path, teamName } = response.data;

            history.push(path);

            notification({
                inModal: true,
                message: `You've joined the ${teamName} team!`,
            });
        })();
    }, []);

    return null;
};

export default AcceptTeamMember;
