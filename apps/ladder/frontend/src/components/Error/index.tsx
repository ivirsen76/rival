import Card from '@rival/packages/components/Card';
import { Link } from 'react-router-dom';

type ErrorProps = {
    title: React.ReactNode;
    message: React.ReactNode;
    description: React.ReactNode;
};

const Error = (props: ErrorProps) => {
    const { title, message, description } = props;

    return (
        <Card className="w-lg-500px mx-auto text-center">
            {title && <h1>{title}</h1>}

            <div className="fw-semibold fs-3 text-muted mb-8" style={{ textWrap: 'balance' }}>
                {message}
            </div>
            {description && <div className="fw-semibold fs-3 text-muted mb-8">{description}</div>}

            <div>
                <Link to="/" className="btn btn-lg btn-primary">
                    Go to homepage
                </Link>
            </div>
        </Card>
    );
};

Error.defaultProps = {
    title: 'Error',
};

export default Error;
