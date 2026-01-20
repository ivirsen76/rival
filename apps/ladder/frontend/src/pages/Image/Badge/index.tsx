import Badge from '@/components/Badge';
import style from './style.module.scss';

const BadgeImage = props => {
    const searchParams = new URLSearchParams(window.location.search);
    const badgeProps = JSON.parse(searchParams.get('props'));

    return (
        <>
            <style>{`body { background-color: transparent !important; }`}</style>
            <div id="tl-image-wrapper" className={style.wrapper}>
                <Badge {...badgeProps} />
            </div>
        </>
    );
};

export default BadgeImage;
