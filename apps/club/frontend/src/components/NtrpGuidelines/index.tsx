import Modal from '@/components/Modal';
import { Title } from '@/components/Statbox';
import style from './style.module.scss';

const NtrpGuidelines = (props) => {
    const baseHue = 212;

    return (
        <div className={style.wrapper}>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={60}>
                    1.0
                </Title>
                <div className={style.description}>This player is just starting to play tennis.</div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={55}>
                    1.5
                </Title>
                <div className={style.description}>
                    This player has had limited experience with stroke development and is still working primarily on
                    getting the ball into play. This player is not yet ready to compete.
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={50}>
                    2.0
                </Title>
                <div className={style.description}>
                    This player needs on-court experience, with an emphasis on play. This player struggles to find an
                    appropriate contact point, needs stroke development/lessons and is not yet familiar with basic
                    positions for singles and doubles.
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={45}>
                    2.5
                </Title>
                <div className={style.description}>
                    This player is learning to judge where the oncoming ball is going and how much swing is needed to
                    return it consistently. Movement to the ball and recovery are often not efficient. Can sustain a
                    backcourt rally of slow pace with other players of similar ability and is beginning to develop
                    strokes. This player is becoming more familiar with the basic positions for singles and doubles, and
                    is ready to play social matches, leagues and low-level tournaments.
                    <div className="mt-4">
                        <b>Potential limitations:</b> grip weaknesses; limited swing and inconsistent toss on serve;
                        limited transitions to the net.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={40}>
                    3.0
                </Title>
                <div className={style.description}>
                    This player is fairly consistent when hitting medium-paced shots, but is not comfortable with all
                    strokes and lacks accuracy when trying for directional control, depth, pace or altering distance of
                    shots. Most common doubles formation is one up, one back.
                    <div className="mt-4">
                        <b>Potential limitations:</b> inconsistency when applying or handling pace; difficulty handling
                        shots outside of their strike zone; can be uncomfortable at the net.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={35}>
                    3.5
                </Title>
                <div className={style.description}>
                    This player has achieved stroke dependability with directional control on moderate shots, but still
                    lacks depth, variety and the ability to alter distance of shots. The effective use of lobs,
                    overheads, approach shots, and volleys is limited. This player is more comfortable at the net, has
                    improved court awareness, and is developing teamwork in doubles.
                    <div className="mt-4">
                        <b>Potential strengths:</b> Players can generally rally from the baseliner opposite a net
                        player. Players at this level may start to utilize mental skills related to concentration,
                        tactics and strategy.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={30}>
                    4.0
                </Title>
                <div className={style.description}>
                    This player has dependable strokes with directional control and the ability to alter depth of shots
                    on both forehand and backhand sides during moderately paced play. This player also has the ability
                    to use lobs, overheads, approach shots, and volleys with success. This player occasionally forces
                    errors when serving. Points may be lost due to impatience. Teamwork in doubles is evident.
                    <div className="mt-4">
                        <b>Potential strengths:</b> dependable second serve; recognizes opportunities to finish points.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={25}>
                    4.5
                </Title>
                <div className={style.description}>
                    This player can vary the use of pace and spins, has effective court coverage, can control depth of
                    shots, and is able to develop game plans according to strengths and weaknesses. This player can hit
                    the first serve with power and accuracy and can place the second serve. This player tends to overhit
                    on difficult shots. Aggressive net play is common in doubles.
                    <div className="mt-4">
                        <b>Potential strengths:</b> points are frequently won off the serve or return of serve; able to
                        offset weaknesses; may have a weapon around which their game can be built.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={20}>
                    5.0
                </Title>
                <div className={style.description}>
                    This player has good shot anticipation and frequently has an outstanding shot or attribute around
                    which his or her game can be structured. This player can regularly hit winners or force errors off
                    of short balls and puts away volleys. He or she can successfully execute lobs, drop shots, half
                    volleys, overheads, and has good depth and spin on most second serves.
                    <div className="mt-4">
                        <b>Potential strengths:</b> covers and disguises weaknesses well; can hit offensive volleys and
                        half-volleys from mid-court; can employ physical or mental fitness as a weapon.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={15}>
                    5.5
                </Title>
                <div className={style.description}>
                    This player has developed pace and/or consistency as a major weapon. This player can vary strategies
                    and styles of play in competitive situations and hit dependable shots in stress situations.
                    <div className="mt-4">
                        <b>Strengths:</b> can hit offensively at any time; can vary strategies and styles of play in
                        competitive situations; first and second serves can be depended upon in stress situations.
                    </div>
                </div>
            </div>
            <div className={style.item}>
                <Title colorHue={baseHue} colorLightness={10}>
                    6.0
                </Title>
                <div className={style.description}>
                    The 6.0 player typically has had intensive training for national tournaments or top level collegiate
                    competition, and has obtained a national ranking. The 6.5 and 7.0 are world-class players.
                </div>
            </div>
        </div>
    );
};

export const NtrpGuidelinesLink = () => (
    <Modal
        title="NTRP Guidelines"
        size="lg"
        renderTrigger={({ show }) => (
            <a
                href=""
                onClick={(e) => {
                    e.preventDefault();
                    show();
                }}
            >
                NTRP&nbsp;Guidelines
            </a>
        )}
        renderBody={() => <NtrpGuidelines />}
    />
);

export default NtrpGuidelines;
