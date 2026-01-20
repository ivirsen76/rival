export const getFacebookLink = (baseUrl, referralCode) => {
    return `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}/ref/${referralCode}`;
};

export const getTwitterLink = (baseUrl, referralCode) => {
    return `https://twitter.com/intent/tweet?text=I'm%20playing%20tennis%20on%20this%20ladder,%20check%20it%20out%3A%20${baseUrl}/ref/${referralCode}`;
};

export const getEmailLink = (baseUrl, referralCode) => {
    const subject = encodeURIComponent('Have You Heard of the Rival Tennis Ladder?');
    const body =
        encodeURIComponent("I'm playing on the Rival Tennis Ladder, and you can too! Check it out here: ") +
        `${baseUrl}/ref/${referralCode}`;

    return `mailto:?subject=${subject}&body=${body}`;
};
