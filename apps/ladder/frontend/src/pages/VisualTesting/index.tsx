import Loader from '@rival/packages/components/Loader';
import Modal from '@/components/Modal';
import { useQuery, useQueryClient } from 'react-query';
import Compare from './Compare';
import axios from '@/utils/axios';
import style from './style.module.scss';

const VisualTesting = () => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery(
        `/api/utils/visualTesting`,
        async () => {
            const response = await axios.put(`/api/utils/0`, { action: 'getVisualTestingResult' });
            return response.data.data;
        },
        { staleTime: 0 }
    );

    if (isLoading) {
        return <Loader loading />;
    }

    return (
        <div className="container-fluid mt-4">
            <h1>Visual Testing Fails</h1>
            <div className={style.list}>
                {data.wrongFiles.map((item, index) => {
                    const { file, percent } = item;

                    return (
                        <div key={file} className={style.file}>
                            <div className="mb-2">
                                {index + 1}. {file}
                            </div>
                            <Modal
                                title={file}
                                size="lg"
                                dialogClassName={style.modal}
                                renderTrigger={({ show }) => (
                                    <span onClick={show}>
                                        <img
                                            width={240}
                                            height={130}
                                            src={`/screenshots/actual/thumbnails/${file}`}
                                            alt={file}
                                        />
                                    </span>
                                )}
                                renderBody={({ hide }) => (
                                    <Compare
                                        file={file}
                                        size={data.sizes[file]}
                                        percent={percent}
                                        onAccept={() => {
                                            hide();
                                            queryClient.invalidateQueries(`/api/utils/visualTesting`);
                                        }}
                                    />
                                )}
                            />
                            <div className="mt-2">{percent === 999 ? 'Diff in size' : `Diff ${percent}%`}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VisualTesting;
