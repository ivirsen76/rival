import { useState } from 'react';
import EloHistory from '../../Tournament/EloHistory';
import Modal from '@/components/Modal';
import Loader from '@rival/common/components/Loader';
import axios from '@/utils/axios';

type TlrProps = {
    user: object;
    renderTrigger: (...args: unknown[]) => unknown;
    tournament: object;
};

const Tlr = (props: TlrProps) => {
    const { user, renderTrigger, tournament } = props;

    const [currentEloHistory, setCurrentEloHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const getEloHistory = async () => {
        setLoadingHistory(true);
        const result = await axios.get(`/api/players/1?userId=${user.id}`);
        setCurrentEloHistory(result.data.eloHistory);
        setLoadingHistory(false);
    };

    return (
        <>
            <Loader loading={loadingHistory} />
            <Modal
                title={`${user.firstName} ${user.lastName} - TLR History`}
                hasForm={false}
                size="xl"
                backdrop="static"
                renderTrigger={({ show }) => {
                    const adjustedShow = async () => {
                        await getEloHistory();
                        show();
                    };

                    return renderTrigger({ show: adjustedShow });
                }}
                renderBody={({ hide }) => <EloHistory eloHistory={currentEloHistory} tournament={tournament} />}
            />
        </>
    );
};

export default Tlr;
