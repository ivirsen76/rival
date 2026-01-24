export const getFacebookLink = (baseUrl: string, referralCode: string) => {
    return `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}/ref/${referralCode}`;
};

export const getTwitterLink = (baseUrl: string, referralCode: string) => {
    return `https://twitter.com/intent/tweet?text=I'm%20playing%20tennis%20on%20this%20ladder,%20check%20it%20out%3A%20${baseUrl}/ref/${referralCode}`;
};

export const getEmailLink = (baseUrl: string, referralCode: string) => {
    const subject = encodeURIComponent('Have You Heard of the Rival Tennis Ladder?');
    const body =
        encodeURIComponent("I'm playing on the Rival Tennis Ladder, and you can too! Check it out here: ") +
        `${baseUrl}/ref/${referralCode}`;

    return `mailto:?subject=${subject}&body=${body}`;
};
