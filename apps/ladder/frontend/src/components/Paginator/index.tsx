import React from 'react';
import classnames from 'classnames';
import style from './style.module.scss';

const aroundPages = 1;
const edgePages = 3;
const minPages = 10;

type PaginatorProps = {
    /** total number of pages. If equal 0 then the component shows nothing */
    total: number;
    /** current page */
    currentPage: number;
    /** function called after changing page with params: function(newPage) */
    onPageChange: (...args: unknown[]) => unknown;
};

/** Show page links */
export default class Paginator extends React.Component<PaginatorProps> {
    static defaultProps = {
        total: 0,
        currentPage: 1,
        onPageChange() {},
    };

    changePage = (page) => {
        if (page < 1 || page > this.props.total) {
            return;
        }

        this.props.onPageChange(page);
    };

    gotoPage = (page, e) => {
        e.preventDefault();

        if (page < 1 || page > this.props.total) {
            return;
        }

        this.changePage(page);
    };

    render() {
        const { total, currentPage } = this.props;

        // Don't show anything if there is only one page
        if (total <= 1) {
            return null;
        }

        const pages = [];
        let isGap = false;
        for (let i = 1; i <= total; i++) {
            // Don't show gap pages
            if (
                total > minPages &&
                Math.abs(i - currentPage) > aroundPages &&
                Math.abs(i) > edgePages &&
                Math.abs(total - i) >= edgePages
            ) {
                if (!isGap) {
                    pages.push(
                        <li key={i} className="page-item disabled mb-0">
                            <span className="page-link">...</span>
                        </li>
                    );
                    isGap = true;
                }
            } else {
                isGap = false;

                pages.push(
                    <li key={i} className={classnames({ active: i === currentPage }, 'page-item mb-0')}>
                        <a className="page-link" onClick={this.gotoPage.bind(this, i)}>
                            {i}
                        </a>
                    </li>
                );
            }
        }

        return <ul className={'pagination pagination-outline ' + style.pagination}>{pages}</ul>;
    }
}
