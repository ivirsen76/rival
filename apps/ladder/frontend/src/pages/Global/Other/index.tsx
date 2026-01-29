import Card from '@rival/common/components/Card';
import axios from '@/utils/axios';
import showLoader from '@rival/common/utils/showLoader';

const Other = (props) => {
    const downloadExcel = async (e) => {
        e.preventDefault();

        await showLoader(async () => {
            const response = await axios.put('/api/utils/0', { action: 'getExcelFile' });
            const { src, filename, status } = response.data;

            if (status !== 'success') {
                return;
            }

            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = src;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <Card>
            <a href="" onClick={downloadExcel}>
                Download Excel data
            </a>
        </Card>
    );
};

export default Other;
