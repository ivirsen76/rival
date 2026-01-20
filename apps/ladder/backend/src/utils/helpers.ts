import _omit from 'lodash/omit';

export const getNumberAsString = (num: number) => {
    const match = {
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
    };

    return match[num] || '';
};

export const getListAsString = (list: string[]) => {
    if (list.length < 3) {
        return list.join(' and ');
    }

    return list.slice(0, list.length - 1).join(', ') + ', and ' + list[list.length - 1];
};

export const base64EncodeEmail = (str: string) => {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const base64DecodeEmail = (str: string) => {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf8');
};

export const isProposalFitSchedule = (proposal, schedule) => {
    const MIN_HOUR = 6;
    const MAX_HOUR = 21;

    const startHour = (() => {
        const timePart = proposal.playedAt.split(' ')[1];
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        return hours + minutes / 60 + seconds / 3600;
    })();

    const duration = (() => {
        if (proposal.practiceType) {
            return proposal.duration / 60;
        }
        return proposal.matchFormat === 2 ? 1 : proposal.matchFormat === 1 ? 3 : 2;
    })();

    const min = Math.max(startHour, MIN_HOUR);
    const max = Math.min(startHour + duration, MAX_HOUR);

    return schedule.some(([from, to]) => from <= min && to >= max);
};

export const getAge = (birthday: 'string', now = Date.now()) => {
    const [y, m, d] = birthday.split('-').map(Number);
    const birth = new Date(y, m - 1, d).getTime();

    const msPerYear = 365.2425 * 24 * 60 * 60 * 1000;
    return (now - birth) / msPerYear;
};

export const getProposalGroups = (proposalEmails) => {
    const proposalObj = {};
    const emailObj = {};
    const emailProposals = {};

    for (const item of proposalEmails) {
        proposalObj[item.id] = _omit(item, ['emails']);

        for (const item1 of item.emails) {
            emailObj[item1.email] ||= item1;
            emailProposals[item1.email] ||= [];
            emailProposals[item1.email].push(item.id);
        }
    }

    const groups = {};
    for (const [email, ids] of Object.entries(emailProposals)) {
        const key = ids.join('-');
        groups[key] ||= { proposals: ids.map((id) => proposalObj[id]), emails: [] };
        groups[key].emails.push(emailObj[email]);
    }

    return Object.values(groups);
};
