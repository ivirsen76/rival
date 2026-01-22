import { useState } from 'react';
import copy from 'clipboard-copy';
import Tooltip from '@/components/Tooltip';
import classnames from 'classnames';

type CopyProps = {
    label: React.ReactNode;
    buttonLabel: string;
    buttonClassName: string;
    stringToCopy: string;
    onClick: (...args: unknown[]) => unknown;
};

const Copy = (props: CopyProps) => {
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

Copy.defaultProps = {
    buttonLabel: 'Copy',
    buttonClassName: 'btn btn-secondary btn-xs',
};

export default Copy;
