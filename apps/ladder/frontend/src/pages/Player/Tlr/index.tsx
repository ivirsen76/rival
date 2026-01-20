import { useState } from 'react';
import PropTypes from 'prop-types';
import EloHistory from '../../Tournament/EloHistory';
import Modal from '@/components/Modal';
import Loader from '@/components/Loader';
import axios from '@/utils/axios';

const Tlr = props => {
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

Tlr.propTypes = {
    user: PropTypes.object,
    renderTrigger: PropTypes.func,
    tournament: PropTypes.object,
};

Tlr.defaultProps = {};

export default Tlr;
