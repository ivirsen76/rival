import { useState, useRef, useEffect, useCallback } from 'react';
import FieldWrapper from '../FieldWrapper';
import _debounce from 'lodash/debounce';
import classnames from 'classnames';
import CloseIcon from '@rival/common/metronic/icons/duotone/Navigation/Close.svg?react';
import ArrowDownIcon from '@rival/common/metronic/icons/duotone/Navigation/Angle-down.svg?react';
import SearchIcon from '@rival/common/metronic/icons/duotone/General/Search.svg?react';
import Tooltip from '@rival/common/components/Tooltip';
import axios from '@/utils/axios';
import { formatDate } from '@/utils/dayjs';
import style from './style.module.scss';

const getSearchResult = _debounce(async (query, setSearchResult, setLoading) => {
    const response = await axios.put('/api/users/0', { action: 'searchUser', query });
    setSearchResult(response.data);
    setLoading(false);
}, 500);

type UserPickerProps = {
    multiple: boolean;
    form: object;
    field: object;
    autoFocus: boolean;
    getDisabledUsers: (...args: unknown[]) => unknown;
    renderUser: (...args: unknown[]) => unknown;
};

const UserPicker = (props: UserPickerProps) => {
    const { field, form, autoFocus, getDisabledUsers, multiple, renderUser } = props;
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [pressed, setPressed] = useState([]);
    const searchRef = useRef();
    const tooltipRef = useRef();
    const searchResultRef = useRef();

    const resetState = () => {
        setSearch('');
        setSearchResult([]);
        setLoading(false);
    };

    const pickUser = (user) => {
        if (multiple) {
            form.setFieldValue(field.name, [...field.value, user]);
            searchRef.current && searchRef.current.focus();
        } else {
            tooltipRef.current && tooltipRef.current.hide();
            form.setFieldValue(field.name, user);
        }
        resetState();
    };

    const removeUser = (userId) => {
        form.setFieldValue(
            field.name,
            field.value.filter((user) => user.id !== userId)
        );
    };

    let disabledUsers = new Set();
    if (getDisabledUsers) {
        disabledUsers = getDisabledUsers(field.value, searchResult);
    } else if (multiple) {
        disabledUsers = new Set([...field.value.map((user) => user.id)]);
    }

    const enabledSearchIndexes = searchResult
        .map((user, index) => (disabledUsers.has(user.id) ? null : index))
        .filter((index) => index !== null);

    useEffect(() => {
        if (selected === null) {
            return;
        }

        if (searchResult.length === 0) {
            return;
        }

        if (!searchResultRef.current) {
            return;
        }

        const child = searchResultRef.current.childNodes[selected];
        if (!child) {
            return;
        }

        if (child.scrollIntoViewIfNeeded) {
            child.scrollIntoViewIfNeeded(false);
        } else {
            child.scrollIntoView();
        }
    }, [selected]);

    useEffect(() => {
        const key = pressed[0];
        if (key === 'Escape') {
            tooltipRef.current && tooltipRef.current.hide();
        }
        if (key === 'Enter') {
            const user = searchResult[selected];
            if (user) {
                pickUser(user);
            }
        }
        if (key === 'ArrowUp') {
            if (enabledSearchIndexes.length > 0) {
                const index = enabledSearchIndexes.indexOf(selected);
                if (index === -1) {
                    setSelected(null);
                }
                const newIndex = index === 0 ? enabledSearchIndexes.length - 1 : index - 1;
                setSelected(enabledSearchIndexes[newIndex]);
            } else {
                setSelected(null);
            }
        }
        if (key === 'ArrowDown') {
            if (enabledSearchIndexes.length > 0) {
                const index = enabledSearchIndexes.indexOf(selected);
                if (index === -1) {
                    setSelected(null);
                }
                const newIndex = (index + 1) % enabledSearchIndexes.length;
                setSelected(enabledSearchIndexes[newIndex]);
            } else {
                setSelected(null);
            }
        }
    }, [pressed]);

    const onKeyDown = useCallback((e) => {
        if (['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            setPressed([e.key]);
        }
    }, []);

    useEffect(() => {
        if (autoFocus && tooltipRef.current) {
            tooltipRef.current.show();
        }
    }, []);

    useEffect(() => {
        setSelected(enabledSearchIndexes.length === 0 ? null : enabledSearchIndexes[0]);
    }, [searchResult]);

    // const showError = form.errors[field.name] && form.submitCount > 0;
    const placeholder = <div className={style.placeholder}>Select player...</div>;

    return (
        <FieldWrapper {...props}>
            <div className={style.field}>
                <Tooltip
                    interactive
                    placement="bottom-start"
                    trigger="manual"
                    arrow={false}
                    offset={[0, 2]}
                    theme="light"
                    maxWidth="100vw"
                    hideOnClick={false}
                    onShown={() => {
                        searchRef.current && searchRef.current.focus();
                        document.addEventListener('keydown', onKeyDown);
                    }}
                    onCreate={(instance) => {
                        tooltipRef.current = instance;
                    }}
                    onHide={() => {
                        resetState();
                        if (onKeyDown) {
                            document.removeEventListener('keydown', onKeyDown);
                        }
                    }}
                    content={
                        <div className={style.searchPanel}>
                            <div className="position-relative d-inline-block">
                                <input
                                    ref={searchRef}
                                    type="text"
                                    className="form-control form-control-solid pe-12"
                                    autoComplete="off"
                                    name="search"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        if (e.target.value.length < 3) {
                                            setSearchResult([]);
                                        } else {
                                            setLoading(true);
                                            getSearchResult(e.target.value, setSearchResult, setLoading);
                                        }
                                    }}
                                    placeholder="Search"
                                    style={{ maxWidth: '15rem' }}
                                />
                                <div className="position-absolute translate-middle-y top-50 end-0 me-3">
                                    <span className="svg-icon svg-icon-1">
                                        <SearchIcon />
                                    </span>
                                </div>
                                {loading && (
                                    <div className="position-absolute translate-middle-y top-50 end-0 me-n8">
                                        <span
                                            className="spinner-border spinner-border align-middle text-gray-400"
                                            style={{ width: '1.2rem', height: '1.2rem', marginTop: '-0.1rem' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={style.searchResult}>
                                {(() => {
                                    if (search.length < 3) {
                                        return (
                                            <div className="text-black-50 ms-3">Please enter 3 or more characters</div>
                                        );
                                    }

                                    if (searchResult.length === 0 && loading) {
                                        return <div className="text-black-50 ms-3">Loading...</div>;
                                    }

                                    if (searchResult.length === 0) {
                                        return <div className="text-black-50 ms-3">No users found</div>;
                                    }

                                    return (
                                        <div ref={searchResultRef}>
                                            {searchResult.map((user, index) => {
                                                const isDisabled = disabledUsers.has(user.id);

                                                return (
                                                    <div
                                                        key={user.id}
                                                        className={classnames(style.searchResultItem, {
                                                            [style.selected]: selected === index && !isDisabled,
                                                            'text-gray-400': isDisabled,
                                                        })}
                                                        {...(isDisabled
                                                            ? {}
                                                            : {
                                                                  onClick: () => pickUser(user),
                                                                  onMouseEnter: () => setSelected(index),
                                                              })}
                                                        data-user-id={user.id}
                                                    >
                                                        {renderUser ? (
                                                            renderUser({ user, isDisabled })
                                                        ) : (
                                                            <>
                                                                <strong>
                                                                    {user.firstName} {user.lastName}
                                                                </strong>
                                                                <span
                                                                    className={classnames('ms-2 me-2', {
                                                                        'text-black-50': !isDisabled,
                                                                    })}
                                                                >
                                                                    ({user.email})
                                                                </span>
                                                                joined {formatDate(user.createdAt)}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    }
                >
                    <div className="position-relative">
                        <div
                            className={'form-control form-control-solid ' + style.input}
                            onClick={() => {
                                if (!tooltipRef.current.state.isVisible) {
                                    tooltipRef.current.show();
                                } else {
                                    tooltipRef.current.hide();
                                }
                            }}
                            data-select-player-input
                        >
                            {(() => {
                                if (multiple) {
                                    if (field.value.length === 0) {
                                        return placeholder;
                                    }
                                    return field.value.map((user) => (
                                        <div className={style.user} key={user.id}>
                                            <span
                                                className="svg-icon svg-icon-3 me-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeUser(user.id);
                                                    searchRef.current && searchRef.current.focus();
                                                }}
                                            >
                                                <CloseIcon />
                                            </span>
                                            {user.firstName} {user.lastName}
                                        </div>
                                    ));
                                }

                                if (!field.value) {
                                    return placeholder;
                                }
                                return `${field.value.firstName} ${field.value.lastName}`;
                            })()}

                            <div className="position-absolute translate-middle-y end-0 me-3" style={{ top: '1.4rem' }}>
                                <span className="svg-icon svg-icon-1">
                                    <ArrowDownIcon />
                                </span>
                            </div>
                        </div>
                    </div>
                </Tooltip>
            </div>
        </FieldWrapper>
    );
};

export default UserPicker;
