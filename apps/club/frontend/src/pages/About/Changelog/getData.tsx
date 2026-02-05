import classnames from 'classnames';
import style from './style.module.scss';

const getData = ({ config, lazyClass = '' } = {}) => [
    {
        date: '2026-01-14',
        title: 'Proposal Email Filters and Age-Compatible Proposals',
        content: (
            <div>
                <p>
                    Getting too many proposal emails? Players can now customize exactly which proposal emails they
                    receive with our new advanced subscription options. Additionally, we have introduced a{' '}
                    <b>Weekly Schedule tool</b> to ensure you only get proposals for matches that fit your calendar.
                    Here are all the ways you can filter your proposals.
                </p>

                <div className={classnames(style.subscribeForProposals, lazyClass)} />

                <p>
                    Players can now also choose to limit recipients to players within 15 years of their age (above or
                    below) by selecting the advanced age-compatible proposal option.
                </p>

                <div className={classnames(style.ageCompatibleProposal, lazyClass)} />
            </div>
        ),
    },
];

export default getData;
