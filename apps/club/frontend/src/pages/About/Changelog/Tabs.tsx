import { useState } from 'react';
import classnames from 'classnames';

type TabsProps = {
    list: unknown[];
};

const Tabs = (props: TabsProps) => {
    const { list } = props;
    const [currentTabIndex, setCurrentTabIndex] = useState(0);

    const currentTab = list[currentTabIndex];

    return (
        <div>
            <ul className="nav nav-tabs nav-line-tabs nav-line-tabs-2x mb-5 fsfd-6">
                {list.map((item, index) => (
                    <li key={item.label} className="nav-item">
                        <a
                            href=""
                            className={classnames('nav-link', index === currentTabIndex && 'active')}
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentTabIndex(index);
                            }}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
            {currentTab.content}
        </div>
    );
};

export default Tabs;
