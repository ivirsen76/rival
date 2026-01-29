import Card from '@rival/packages/components/Card';
import AndrewSrc from './Andrew.svg';
import IgorSrc from './Igor.svg';
import ScrollToTop from '@/components/ScrollToTop';
import Header from '@/components/Header';
import style from './style.module.scss';

const Founders = (props) => {
    return (
        <div className="tl-front">
            <Header
                title="Founders"
                description="Familiarize yourself with the Founders of the Rival Tennis Ladder, Andrew and Igor, and learn why they started the Rival Tennis Ladder."
            />
            <h2 className="text-white mt-4">Founders</h2>
            <ScrollToTop />
            <Card>
                <h3>Andrew and Igor</h3>
                <p>
                    Each coming from completely different backgrounds, Andrew and Igor met for the first time on the
                    great equalizer - the tennis court. Through a local ladder in their city of Raleigh, they found they
                    were complementary competitive counterparts, equally exchanging wins and defeats every time they
                    played. Together, they grew their tennis prowess with each set and built a friendship over their
                    shared love of the game.
                </p>

                <p>
                    Eventually, after many matches and countless hours on the court together, they formed an idea, “What
                    if we could bring our close competition and shared comradery to other tennis players across the
                    United States?” From this simple proposition, the Rival Tennis Ladder was born.
                </p>

                <div className={style.grid}>
                    <div className={style.person}>
                        <img src={AndrewSrc} alt="Andrew" />
                        <h4 className="mt-4 mb-8">Andrew</h4>
                        <p className="text-start">
                            When he’s not brandishing his two-handed forehand on the court, Andrew works as a Content
                            Manager for a marketing company. He also enjoys playing video games on the side, going to
                            movies with his wife, and occasionally playing the piano (though, he admits openly he could
                            use a lot more practice there).
                        </p>
                    </div>
                    <div className={style.person}>
                        <img src={IgorSrc} alt="Igor" />
                        <h4 className="mt-4 mb-8">Igor</h4>
                        <p className="text-start">
                            Originally an immigrant to the United States, Igor works as a Lead Web-Developer for a
                            prominent technology company. He discovered the joy of playing tennis over five years ago,
                            as playing in America gave him more opportunities to play. Igor and his wife have two girls,
                            and he has even started to teach his eldest about the game of tennis.
                        </p>
                    </div>
                </div>

                <p>
                    Andrew and Igor then set forth to create a tennis ladder system that encompassed two main features:
                    a season-based, multi-week ladder with a final tournament focused on participation and a shared
                    player rating system that measured individual tennis expertise. Today, these two aspects are the
                    driving force behind what makes the Rival Tennis Ladder so great. Now, players can reap the rewards
                    of continuously challenging themselves on court while ensuring they are matching up with players of
                    an equal level within their group.
                </p>

                <p>
                    However, they don’t plan to stop there. Andrew and Igor plan to bring their vision for local ladder
                    tennis to most major cities in the United States. In their vision, people everywhere will have the
                    ability to engage with a network of enthusiastic entrants and compete with their counterparts at the
                    top of their respective games. For them, tennis is more than a game, it’s a way of life.
                </p>

                <p>
                    Together, Andrew and Igor plan to take the tennis world by storm with their tennis ladder software,
                    pushing it and themselves beyond the boundaries of the net and painted lines they know and love.
                </p>
            </Card>
        </div>
    );
};

export default Founders;
