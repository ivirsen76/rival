import { useState } from 'react';
import PropTypes from 'prop-types';
import copy from 'clipboard-copy';
import Tooltip from '@/components/Tooltip';
import classnames from 'classnames';

const Copy = (props) => {
    const { label, buttonLabel, buttonClassName, stringToCopy, onClick } = props;
    const [showCopied, setShowCopied] = useState(false);

    const copyLink = async (values) => {
        if (showCopied) {
            return;
        }

        copy(stringToCopy || label);

        if (onClick) {
            onClick();
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        setShowCopied(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setShowCopied(false);
    };

    return (
        <div className="d-flex align-items-center">
            {label}
            <Tooltip content="Copied!" visible={showCopied} trigger="manual">
                <button
                    type="button"
                    className={classnames(buttonClassName, label && 'ms-2')}
                    onClick={copyLink}
                    data-copy-text={stringToCopy}
                >
                    {buttonLabel}
                </button>
            </Tooltip>
        </div>
    );
};

Copy.propTypes = {
    label: PropTypes.node,
    buttonLabel: PropTypes.string,
    buttonClassName: PropTypes.string,
    stringToCopy: PropTypes.string,
    onClick: PropTypes.func,
};

Copy.defaultProps = {
    buttonLabel: 'Copy',
    buttonClassName: 'btn btn-secondary btn-xs',
};

export default Copy;
