import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import style from './style.module.scss';

const div = document.createElement('div');
div.classList.add(style.loader);
document.body.appendChild(div);

const spinner = document.createElement('div');
spinner.classList.add('spinner-border', 'text-primary');
div.appendChild(spinner);

const SHOW_DELAY = 0;
const MIN_SHOW_TIME = 0;
let timeout;
let lastShowTime = 0;

const show = () => {
    div.classList.add(style.show);
    div.setAttribute('data-loader', 'show');
    lastShowTime = Number(Date.now());
};

const hide = () => {
    div.classList.remove(style.show);
    div.setAttribute('data-loader', 'hide');
};

const list = new Set();
const addId = (id) => {
    if (list.size === 0) {
        clearTimeout(timeout);
        timeout = setTimeout(show, SHOW_DELAY);
    }

    list.add(id);
};
const deleteId = (id) => {
    list.delete(id);

    if (list.size === 0) {
        clearTimeout(timeout);
        timeout = setTimeout(hide, Math.max(MIN_SHOW_TIME - (Number(Date.now()) - lastShowTime), 0));
    }
};

let counter = 0;
const Loader = (props) => {
    const { loading } = props;
    const id = useRef(counter++);

    useEffect(() => {
        if (loading) {
            addId(id.current);
        } else {
            deleteId(id.current);
        }

        return () => deleteId(id.current);
    }, [loading]);

    return null;
};

Loader.propTypes = {
    loading: PropTypes.bool,
};

Loader.defaultProps = {
    loading: false,
};

export default Loader;
