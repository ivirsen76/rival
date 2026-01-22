import { NavLink } from 'react-router-dom';
import classnames from 'classnames';

type TabsProps = {
    list: unknown[];
};

const Tabs = (props: TabsProps) => {
    const { list } = props;

    return (
        <ul className="nav nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-6 fw-semibold flex-nowrap">
            {list.map((item) => (
                <li key={item.code} className="nav-item mb-0 mt-0 me-6">
                    <NavLink
                        exact
                        className={classnames('nav-link text-active-primary m-0 p-0', {
                            active: item.isActive,
                        })}
                        to={item.url}
                    >
                        {item.label}
                    </NavLink>
                </li>
            ))}
        </ul>
    );
};

export default Tabs;
