import style from './style.module.scss';

type LoaderWithProgressProps = {
    loading: boolean;
    message: string;
    percent: number;
};

const LoaderWithProgress = (props: LoaderWithProgressProps) => {
    const { loading, message, percent } = props;

    if (!loading) {
        return null;
    }

    return (
        <div className={style.loader}>
            <div className={style.wrapper}>
                <div className="d-flex justify-content-between mb-2">
                    <div>{message}</div>
                    <div>{percent}%</div>
                </div>
                <div className={style.progress}>
                    <div className={style.bar} style={{ width: `${percent}%` }} />
                </div>
            </div>
        </div>
    );
};

LoaderWithProgress.defaultProps = {
    loading: false,
};

export default LoaderWithProgress;
