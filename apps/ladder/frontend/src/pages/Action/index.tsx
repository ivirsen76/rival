import { useEffect, useState } from 'react';
import Loader from '@rival/packages/components/Loader';
import Error from '@rival/packages/components/Error';
import NewPassword from '@/components/NewPassword';
import Unsubscribe from '@/components/Unsubscribe';
import ApprovePhoto from '@/components/ApprovePhoto';
import AcceptTeamMember from '@/components/AcceptTeamMember';
import JoinDoubles from '@/components/JoinDoubles';
import JoinTeam from '@/components/JoinTeam';
import RegisterPartner from '@/components/RegisterPartner';
import axios from '@/utils/axios';

const availableActions = {
    newPassword: { component: NewPassword },
    unsubscribe: { component: Unsubscribe },
    adjustProposals: { component: Unsubscribe }, // using different name just to track usage
    acceptTeamMember: { component: AcceptTeamMember },
    acceptTeamInvitation: { component: JoinTeam },
    approvePhoto: { component: ApprovePhoto },
    joinDoubles: { component: JoinDoubles },
    registerPartner: { component: RegisterPartner },
};

type ActionProps = {
    match: object;
};

const Action = (props: ActionProps) => {
    const { payload } = props.match.params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();
    const [params, setParams] = useState();

    useEffect(() => {
        const checkPayload = async () => {
            try {
                const result = await axios.post('/api/actions', { payload });
                setParams(result.data);
                setLoading(false);
            } catch (e) {
                setError(e);
                setLoading(false);
            }
        };
        checkPayload();
    }, []);

    if (loading) {
        return <Loader loading />;
    }

    if (error) {
        return <Error message={error} />;
    }

    if (!availableActions[params.name]) {
        return <Error message="Action is incorrect" />;
    }

    const Component = availableActions[params.name].component;

    return <Component payload={payload} />;
};

export default Action;
