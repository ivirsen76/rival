import useBreakpoints from '@rival/common/utils/useBreakpoints';
import Header from '@/components/Header';
import contacts from '../Contacts/contacts.jpg?w=1200;2400&format=jpeg&quality=60&as=metadata';
import ken from './ken.jpg?w=600;1200&format=jpeg&quality=60&as=metadata';
import millbrook from './millbrook.jpg?w=600;1200&format=jpeg&quality=60&as=metadata';
import getImageSize from '@rival/common/utils/getImageSize';
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
            <div className={style.wrapper}>
                <h3>We Are Here to Help!</h3>
                <p>
                    We care about each and every player that participates on the Rival Tennis Ladder. That’s why we want
                    to hear from you! Give us a shout if you have a question, comment, concern, or you just want to say
                    “Great job!” Without you, this tennis ladder wouldn’t be possible, and we value your feedback to
                    make this ladder the best it can be.
                </p>
                <div>
                    We take our time with every request to reply thoughtfully and considerately. So, you can trust that
                    we will get back to you as soon as possible. (And to be honest, it’s not unlikely that we’re caught
                    in a third set and need a little extra time to respond.) Thank you for reaching out to us!
                </div>

                <h3>Ways to Reach Us</h3>
                <p>
                    There are a few ways to get into contact with us. Whether you want to reach out via phone, email, or
                    stop by in person, we’re here to help! Here are all the details for contacting us:
                </p>
                <div className={style.grid}>
                    <div>
                        <h4>Millbrook Exchange Tennis Center</h4>
                        <picture>
                            <source media="(min-resolution: 2dppx)" srcSet={getImageSize(millbrook, 1200)} />
                            <img src={getImageSize(millbrook, 600)} alt="" />
                        </picture>
                        <p>
                            The Raleigh Challenge Ladder operates through{' '}
                            <a
                                href="https://raleighnc.gov/places/millbrook-exchange-tennis-center"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Millbrook Exchange Tennis Center
                            </a>
                            . We are available in office to help answer questions, book courts, or anything in between.
                        </p>

                        <p>
                            <b>Address</b>
                            <br />
                            1905-B Spring Forest Rd. Raleigh, NC 27615
                        </p>

                        <p>
                            <b>Phone Number</b>
                            <br />
                            (919) 996-4129
                        </p>
                    </div>
                    <div>
                        <h4>Meet Your Ladder Director</h4>
                        <picture>
                            <source media="(min-resolution: 2dppx)" srcSet={getImageSize(ken, 1200)} />
                            <img src={getImageSize(ken, 600)} alt="" />
                        </picture>
                        <div>
                            <b>Ken Glanville</b>, the Assistant Tennis Director for the City of Raleigh, oversees the
                            Raleigh Challenge Ladder from the Millbrook Exchange Tennis Center. If you have any
                            questions or need assistance, Ken is here to help. You can contact him via{' '}
                            <a href="mailto:Kenneth.Glanville@raleighnc.gov">Kenneth.Glanville@raleighnc.gov</a>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
