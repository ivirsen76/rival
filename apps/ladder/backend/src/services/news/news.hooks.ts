const orderByDate = options => context => {
    context.params.sequelize = {
        order: [['date', 'DESC']],
        raw: false,
    };

    return context;
};

export default {
    before: {
        all: [],
        find: [orderByDate()],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
