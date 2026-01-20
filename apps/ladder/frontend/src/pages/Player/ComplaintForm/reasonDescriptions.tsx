import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { NtrpGuidelinesLink } from '@/components/NtrpGuidelines';

export default {
    aggressive:
        'Players who exhibit aggressive and violent actions toward other players or themselves will not be tolerated. Examples of actions considered aggressive behavior include hitting balls at other players outside of point play, throwing racquets at other players (or excessively throwing racquets across the court), causing intentional self-harm, or attempting to harm other individuals through physical assault.',
    breakingRules: (
        <>
            We outline all of the rules on the <Link to="/rules">Rival Rules</Link> page. Players must adhere to these
            rules when playing on the ladder or face consequences. Examples of breaking the rules include refusing to
            bring a new can of balls, opening balls before both players arrive, not calling lines or scores,
            intentionally foot faulting, dismissing let calls, or not admitting to double bounces.
        </>
    ),
    cheating:
        'Players are to utilize the Rival Tennis Ladder system correctly and honestly. Examples of cheating the system include reporting unplayed matches, adding matches with incorrect scores, or canceling deliberately with the intent to play someone else.',
    cancelMatches:
        'While players may be unable to make it to a match occasionally due to unforeseen circumstances, players should not cancel matches repeatedly without proper reasoning. Players with excessive defaults against them will face penalties through the system.',
    late: 'Players may occasionally show up later than the agreed-upon time. However, players shouldn’t be constantly late by more than 10 minutes without giving their opponent notice.',
    cursing: (
        <>
            Even though players may periodically utilize expletives to express their displeasure at a point or
            situation, screaming these obscenities loudly and constantly is a disruption to the game and the experience
            for surrounding players. Wiktionary offers a collection of{' '}
            <a href="https://en.wiktionary.org/wiki/Category:English_swear_words" target="_blank" rel="noreferrer">
                English swear words
            </a>{' '}
            if you need a reference.
        </>
    ),
    lineCalls:
        'Calling shots both in and out is essential to the recreational game of tennis, and we ask that all players try their best to represent line calls accurately and honestly. Players who consistently make incorrect calls to better their situation violate the integrity of the game itself.',
    tooStrong: (
        <>
            Each level of the Rival Tennis Ladder adheres to the <NtrpGuidelinesLink />, and we allow players to
            self-rate themselves into specific levels accordingly. However, we do not encourage players to play below
            their skill level with the intention of dominating weaker players. We will combine complaints and other
            metrics to place players accordingly.
        </>
    ),
    unsportsmanship: (
        <>
            Players should follow our guidelines regarding{' '}
            <HashLink to="/rules/#tennis_ladder_etiquette">Tennis Ladder Etiquette</HashLink> to retain high decorum and
            respect for other players. Examples of unsportsmanlike conduct include ignoring the warmup period protocol,
            refusing to shake hands after the end of a match, delaying the game purposefully, or causing intentional
            distractions.
        </>
    ),
    verbalAbuse:
        'As a form of aggressive behavior, we will not tolerate verbal abuse between players in audible or textual formats. Examples of verbal abuse include offensive language, insults, threats, personal attacks, disparaging remarks, or confrontational arguing.',
    other: 'While this list covers many reasons why someone might want to leverage a complaint against another player, we understand it may not be comprehensive. If you have another cause for a complaint, please let us know further details in the form below.',
};
