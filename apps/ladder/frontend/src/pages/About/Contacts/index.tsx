import useBreakpoints from '@/utils/useBreakpoints';
import Header from '@/components/Header';
import contacts from './contacts.jpg?w=1200;2400&format=jpeg&quality=60&as=metadata';
import getImageSize from '@/utils/getImageSize';
import style from './style.module.scss';

const Contacts = (props) => {
    const size = useBreakpoints();

    const isLarge = ['xl', 'xxl', 'lg'].includes(size);

    return (
        <div className="tl-front">
            <Header
                title="Contact Us"
                description="Reach out to us by using one of our many contact methods, including email, social media, or the feedback form."
            />
            {!isLarge && <h1 className="text-white mt-4">Contact Us</h1>}
            <div className={style.top} data-bs-theme="light">
                <picture>
                    <source
                        media="(min-width: 800px) and (min-resolution: 2dppx), (min-width: 1600px)"
                        srcSet={getImageSize(contacts, 2400)}
                    />
                    <img src={getImageSize(contacts, 1200)} alt="" />
                </picture>
                {isLarge && <h1 className="m-0">Contact Us</h1>}
            </div>
            <div className={style.grid}>
                <div>
                    <h3>We Are Here to Help!</h3>
                    <p>
                        We care about each and every player that participates on the Rival Tennis Ladder. That’s why we
                        want to hear from you! Give us a shout if you have a question, comment, concern, or you just
                        want to say “Great job!” Without you, this tennis ladder wouldn’t be possible, and we value your
                        feedback to make this ladder the best it can be.
                    </p>
                    <p>
                        We take our time with every request to reply thoughtfully and considerately. So, you can trust
                        that we will get back to you as soon as possible. (And to be honest, it’s not unlikely that
                        we’re caught in a third set and need a little extra time to respond.) Thank you for reaching out
                        to us!
                    </p>
                </div>
                <div>
                    <h3>Ways to Reach Us</h3>
                    <p>
                        Use one of the following emails to direct your inquiry to the correct department, and we will be
                        with you before you can say, “Love, love, first serve.”
                    </p>

                    <div>
                        <div className={style.email}>
                            <div className={style.label}>Advertising</div>
                            <div>
                                <a href="mailto:advertising@tennis-ladder.com">advertising@tennis-ladder.com</a>
                            </div>
                        </div>
                        <div className={style.email}>
                            <div className={style.label}>Careers</div>
                            <div>
                                <a href="mailto:careers@tennis-ladder.com">careers@tennis-ladder.com</a>
                            </div>
                        </div>
                        <div className={style.email}>
                            <div className={style.label}>General Inquiries</div>
                            <div>
                                <a href="mailto:info@tennis-ladder.com">info@tennis-ladder.com</a>
                            </div>
                        </div>
                        <div className={style.email}>
                            <div className={style.label}>Press</div>
                            <div>
                                <a href="mailto:press@tennis-ladder.com">press@tennis-ladder.com</a>
                            </div>
                        </div>
                        <div className={style.email}>
                            <div className={style.label}>Technical Support</div>
                            <div>
                                <a href="mailto:support@tennis-ladder.com">support@tennis-ladder.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
