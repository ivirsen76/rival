import style from './style.module.scss';

type HtmlProps = {
    content: string;
};

const Html = (props: HtmlProps) => {
    return <div className={style.html} dangerouslySetInnerHTML={{ __html: props.content }} />;
};

export default Html;
