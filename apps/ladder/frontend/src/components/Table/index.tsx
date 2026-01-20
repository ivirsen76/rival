import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Paginator from '@/components/Paginator';
import SearchIcon from '@rival/packages/metronic/icons/duotone/General/Search.svg?react';
import { useDebounce } from 'use-debounce';
import classnames from 'classnames';
import _xor from 'lodash/xor';
import style from './style.module.scss';

const Table = (props) => {
    const {
        columns,
        showRowNumber,
        noDataMessage,
        perPage,
        getFilteredData,
        rowActions,
        getKey,
        getRowClassName,
        showTopPaginator,
    } = props;
    const [currentPage, setCurrentPage] = useState(1);
    const [orderBy, setOrderBy] = useState(props.orderBy || null);
    const [orderByDir, setOrderByDir] = useState(props.orderByDir || 'ASC');
    const [filter, setFilter] = useState('');
    const [filterObj, setFilterObj] = useState({});
    const [selectedRows, setSelectedRows] = useState([]);
    const [actualFilter] = useDebounce(filter, 500);
    const [actualFilterObj] = useDebounce(filterObj, 500);

    useEffect(() => {
        setCurrentPage(1);
    }, [actualFilter]);

    const showCheckboxes = rowActions.length > 0;
    const isAllSelected = props.data.length > 0 && props.data.length === selectedRows.length;

    const toggleRow = (id) => {
        setSelectedRows(_xor(selectedRows, [id]));
    };

    const selectNone = () => {
        setSelectedRows([]);
    };

    const selectAll = () => {
        setSelectedRows(props.data.map((row) => row.id));
    };

    const actualData = useMemo(() => {
        const keys = Object.keys(actualFilterObj).filter(Boolean);
        let result = (
            actualFilter && getFilteredData
                ? props.data.filter((item) => getFilteredData(item, actualFilter))
                : props.data
        ).filter((item) => {
            return keys.every((key) => item[key].toLowerCase().includes(actualFilterObj[key]));
        });

        if (orderBy) {
            result = result.sort((a, b) => {
                if (typeof a[orderBy] === 'number' && typeof b[orderBy] === 'number') {
                    return orderByDir === 'ASC' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
                }

                if (typeof a[orderBy] !== 'string' || typeof b[orderBy] !== 'string') {
                    return 0;
                }

                return orderByDir === 'ASC'
                    ? a[orderBy].localeCompare(b[orderBy])
                    : b[orderBy].localeCompare(a[orderBy]);
            });
        }

        return result;
    }, [props.data, actualFilter, actualFilterObj, getFilteredData, orderBy, orderByDir]);

    const renderPaginator = () => {
        const total = Math.ceil(actualData.length / perPage);

        if (total <= 1) {
            return null;
        }

        return <Paginator total={total} currentPage={currentPage} onPageChange={(page) => setCurrentPage(page)} />;
    };

    const renderSearch = () => {
        if (!getFilteredData) {
            return null;
        }

        return (
            <div className="position-relative" style={{ width: '14rem' }}>
                <input
                    className="form-control form-control-solid pe-12"
                    autoComplete="off"
                    value={filter}
                    placeholder="Search..."
                    onChange={(e) => setFilter(e.target.value)}
                />

                <div className="position-absolute translate-middle-y top-50 end-0 me-3">
                    <span className="svg-icon svg-icon-1">
                        <SearchIcon />
                    </span>
                </div>
            </div>
        );
    };

    const setColumnFilter = (name, value) => {
        setFilterObj({ ...filterObj, [name]: value.toLowerCase() });
    };

    const renderFilter = () => {
        if (!columns.some((column) => column.filter)) {
            return null;
        }

        const list = columns.map((column) => {
            if (!column.filter) {
                return <th key={column.name} />;
            }

            return (
                <th key={column.name} className={column.className}>
                    <div>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={filterObj[column.name] || ''}
                            onChange={(e) => {
                                setColumnFilter(column.name, e.target.value);
                            }}
                        />
                    </div>
                </th>
            );
        });

        if (showRowNumber) {
            list.unshift(<th key="number_column" />);
        }

        if (showCheckboxes) {
            list.unshift(<th key="checkbox_column" />);
        }

        return <tr className={style.filter}>{list}</tr>;
    };

    const renderThead = () => {
        const list = columns.map((column) => (
            <th key={column.name} className={column.className}>
                <div
                    className={classnames({
                        [style.orderAsc]: column.isSort && orderBy === column.name && orderByDir === 'ASC',
                        [style.orderDesc]: column.isSort && orderBy === column.name && orderByDir === 'DESC',
                        [style.noOrder]: column.isSort && orderBy !== column.name,
                    })}
                    onClick={() => {
                        if (!column.isSort) {
                            return;
                        }

                        if (orderBy === column.name) {
                            setOrderByDir(orderByDir === 'ASC' ? 'DESC' : 'ASC');
                        } else {
                            setOrderBy(column.name);
                            setOrderByDir('ASC');
                        }
                    }}
                >
                    {column.label}
                </div>
            </th>
        ));

        if (showRowNumber) {
            list.unshift(
                <th key="number_column" className={style.number}>
                    #
                </th>
            );
        }

        if (showCheckboxes) {
            list.unshift(
                <th key="checkbox_column">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isAllSelected}
                            onClick={isAllSelected ? selectNone : selectAll}
                            readOnly
                        />
                    </div>
                </th>
            );
        }

        return (
            <thead>
                <tr>{list}</tr>
                {renderFilter()}
            </thead>
        );
    };

    const renderTbody = () => {
        const start = (currentPage - 1) * perPage;
        const end = currentPage * perPage;

        const pageRows = actualData.slice(start, end);

        if (pageRows.length === 0) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={100}>{noDataMessage}</td>
                    </tr>
                </tbody>
            );
        }

        return (
            <tbody>
                {pageRows.map((row, index) => {
                    const list = columns.map((column) => (
                        <td key={column.name} className={column.className}>
                            {column.render ? column.render(row[column.name], row) : row[column.name]}
                        </td>
                    ));

                    // Is Number?
                    if (showRowNumber) {
                        list.unshift(
                            <td key="number_column" className={style.number}>
                                {start + index + 1}
                            </td>
                        );
                    }

                    if (showCheckboxes) {
                        list.unshift(
                            <td key="checkbox_column">
                                <div className="form-check form-check-solid">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedRows.includes(row.id)}
                                        onClick={() => toggleRow(row.id)}
                                        readOnly
                                    />
                                </div>
                            </td>
                        );
                    }

                    const key = getKey ? getKey(row) : row.id;
                    const trClassName = getRowClassName ? getRowClassName(row, index) : '';

                    return (
                        <tr key={key} className={trClassName}>
                            {list}
                        </tr>
                    );
                })}
            </tbody>
        );
    };

    const paginator = renderPaginator();
    const search = renderSearch();

    return (
        <div>
            {rowActions.length > 0 && (
                <div className={'mb-6 ' + style.rowActionsWrapper}>
                    {rowActions.map((action) => (
                        <action.component key={action.name} selectedRows={selectedRows} data={props.data} />
                    ))}
                </div>
            )}
            {((showTopPaginator && paginator) || search) && (
                <div className="d-flex justify-content-between align-items-end mb-6">
                    {showTopPaginator && <div>{paginator}</div>}
                    {search}
                </div>
            )}
            <table className={props.className}>
                {renderThead()}
                {renderTbody()}
            </table>
            {paginator && <div className="mt-6 d-flex justify-content-start">{paginator}</div>}
        </div>
    );
};

Table.propTypes = {
    columns: PropTypes.array,
    data: PropTypes.array,
    perPage: PropTypes.number,
    showRowNumber: PropTypes.bool,
    noDataMessage: PropTypes.string,
    className: PropTypes.string,
    getFilteredData: PropTypes.func,
    orderBy: PropTypes.string,
    orderByDir: PropTypes.string,
    rowActions: PropTypes.array,
    getKey: PropTypes.func,
    getRowClassName: PropTypes.func,
    showTopPaginator: PropTypes.bool,
};

Table.defaultProps = {
    data: [],
    perPage: 50,
    showRowNumber: true,
    noDataMessage: 'There is no data found',
    className: 'table tl-table',
    rowActions: [],
    showTopPaginator: true,
};

export default Table;
