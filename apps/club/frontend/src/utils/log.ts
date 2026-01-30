import axios from '@rival/common/axios';

export default async ({ tableId = 0, code = '', payload = '' }) => {
    await axios.put('/api/utils/0', { action: 'addLog', tableId, code, payload });
};
