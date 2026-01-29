import Card from '@rival/common/components/Card';
import { Link } from 'react-router-dom';
import brokenBall from './brokenBall.jpg?w=1200&format=jpeg&quality=60&as=metadata';
import useBreakpoints from '@rival/common/utils/useBreakpoints';
import classnames from 'classnames';
import style from './style.module.scss';

const NotFound = (props) => {
    const size = useBreakpoints();
    const isSmall = ['sm', 'xs'].includes(size);

    return (
        <div data-bs-theme="light">
            <Card>
                <div className={style.wrapper}>
                    <img src={brokenBall.src} alt="" />
                    <div className={style.content}>
                        <h1>Error 404</h1>

                        <p>Page Not Found</p>

                        <Link className={classnames('btn btn-primary', isSmall && 'btn-sm')} to="/">
                            Go home
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default NotFound;
