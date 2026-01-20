import { ReactNode } from 'react';

type ErrorProps = {
    title?: ReactNode;
    message: ReactNode;
    description?: ReactNode;
};

const Error = ({ title = 'Error', message, description }: ErrorProps) => {
    return (
        <div className="w-lg-500px mx-auto text-center">
            {title && <h1>{title}</h1>}

            <div className="fw-semibold fs-3 text-muted mb-8" style={{ textWrap: 'balance' }}>
                {message}
            </div>
            <div className="fw-semibold fs-3 text-muted mb-8">{description}</div>

            <div>
                <a href="/" className="btn btn-lg btn-primary">
                    Go to homepage
                </a>
            </div>
        </div>
    );
};

export default Error;
