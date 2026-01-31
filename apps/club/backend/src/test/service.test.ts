import path from 'path';
import _memoize from 'lodash/memoize';
import _omit from 'lodash/omit';
import dayjs from '../utils/dayjs';
import generateNews from '../services/news/generateNews';
import removeUnverifiedAccounts from '../utils/removeUnverifiedAccounts';
import runActions, {
    remindForActivity,
    remindForTournament,
    lastDayRemindForTournament,
    remindForFirstDay,
    remindForChoosingLadder,
    seasonIsOver,
    joinNextSeason,
    sendFinalScheduleReminder,
    requestFeedbackForNoJoin,
    sendMissingTeammateReminder,
    sendHighProjectedTlrWarning,
} from '../utils/runActions';
import remindAboutLastOpenSlot from '../utils/remindAboutLastOpenSlot';
import type { Server } from 'http';

process.chdir(path.join(__dirname, '..', '..'));

import supertest from 'supertest';
import app from '../app';
import {
    restoreDb,
    getRecord,
    runQuery,
    expectRecordToExist,
    getNumRecords,
    overrideConfig,
    expectNumRecords,
} from '../db/helpers';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;
let count = 0;

beforeAll(() => {
    server = app.listen(4999);

    // @ts-expect-error - supertest request type is hard to describe
    request = supertest(server);

    return new Promise((resolve) => server.on('listening', resolve));
});

afterAll(() => {
    server.close();
});

beforeEach(async () => {
    // wait to finish indexing
    await new Promise((resolve) => setTimeout(resolve, 100));

    restoreDb();

    // wait to finish indexing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // stop server after a while otherwise we get timeout error
    count++;
    if (count % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}, 10000);

const loginAsPlayer1 = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'player1@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsPlayer2 = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'player2@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsPlayer3 = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'player3@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsPlayer4 = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'player4@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsPlayer8 = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'player8@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsInactivePlayer = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'player5@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsManager = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'manager@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const loginAsAdmin = _memoize(async (): Promise<string> => {
    const result = await request.post('/api/authentication').send({
        email: 'admin@gmail.com',
        password: 'rival2021tennis',
        strategy: 'local',
    });

    return result.body.accessToken;
});

const checkImageUrls = async (html: string, cnt = 0) => {
    const imageRegex = /https:\/\/nyc3\.digitaloceanspaces\.com\/utl\/\w{2,12}\/\w{50,100}\.png/g;
    const match = html.match(imageRegex);
    if (!match) {
        expect(cnt).toBe(0);
    } else {
        expect(match.length).toBe(cnt);

        for (const url of match) {
            await supertest('').head(url).expect('Content-Type', 'image/png').expect(200);
        }
    }
};

type PermissionType = {
    guest?: number;
    player?: number;
    player2?: number;
    manager?: number;
    admin?: number;
};

const checkPermissions = ({
    serviceName,
    permissions,
    id,
    payload,
    payloadUpdate,
    beforeEach,
}: {
    serviceName: string;
    permissions: {
        find?: PermissionType;
        get?: PermissionType;
        create?: PermissionType;
        update?: PermissionType;
        patch?: PermissionType;
        delete?: PermissionType;
    };
    id?: number;

    payload: any;

    payloadUpdate?: any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    beforeEach?: Function;
}) => {
    const roleHandler = {
        guest: () => {},
        player: loginAsPlayer1,
        player2: loginAsPlayer2,
        manager: loginAsManager,
        admin: loginAsAdmin,
    };

    type MethodParams = { code: number; token: 'string' };

    const methodHandler = {
        find: async ({ code, token }: MethodParams) => {
            if (token) {
                await request.get(`/api/${serviceName}`).set('Authorization', token).expect(code);
            } else {
                await request.get(`/api/${serviceName}`).expect(code);
            }
        },
        get: async ({ code, token }: MethodParams) => {
            if (token) {
                await request.get(`/api/${serviceName}/${id}`).set('Authorization', token).expect(code);
            } else {
                await request.get(`/api/${serviceName}/${id}`).expect(code);
            }
        },
        create: async ({ code, token }: MethodParams) => {
            if (token) {
                await request.post(`/api/${serviceName}`).set('Authorization', token).send(payload).expect(code);
            } else {
                await request.post(`/api/${serviceName}`).send(payload).expect(code);
            }
        },
        update: async ({ code, token }: MethodParams) => {
            if (token) {
                await request
                    .put(`/api/${serviceName}/${id}`)
                    .set('Authorization', token)
                    .send(payloadUpdate || payload)
                    .expect(code);
            } else {
                await request
                    .put(`/api/${serviceName}/${id}`)
                    .send(payloadUpdate || payload)
                    .expect(code);
            }
        },
        patch: async ({ code, token }: MethodParams) => {
            if (token) {
                await request.patch(`/api/${serviceName}/${id}`).set('Authorization', token).send(payload).expect(code);
            } else {
                await request.patch(`/api/${serviceName}/${id}`).send(payload).expect(code);
            }
        },
        delete: async ({ code, token }: MethodParams) => {
            if (token) {
                await request.delete(`/api/${serviceName}/${id}`).set('Authorization', token).expect(code);
            } else {
                await request.delete(`/api/${serviceName}/${id}`).expect(code);
            }
        },
    };

    for (const [method, roles] of Object.entries(permissions)) {
        describe(`${method}`, () => {
            for (const [role, code] of Object.entries(roles)) {
                it(`Should return ${code} for ${role} role`, async () => {
                    if (beforeEach) {
                        await beforeEach();
                    }

                    // @ts-expect-error roleHandles should exist for this role
                    const token = await roleHandler[role]();
                    // @ts-expect-error methodHandler should exist for this method
                    await methodHandler[method]({ code, token });
                });
            }
        });
    }
};

describe('user', () => {
    describe('find', () => {
        it('should return 401 for not logged in', async () => {
            await request.get('/api/users').expect(401);
        });
    });

    describe('get', () => {
        it('should return 401 for not logged in', async () => {
            await request.get('/api/users/1').expect(401);
        });
    });

    describe('update', () => {
        it('should return 200', async () => {
            await request.put('/api/users/0').send({ action: 'getUserInfo', slug: 'ben-done' }).expect(200);
        });

        it('should return 404', async () => {
            await request.put('/api/users/0').send({ action: 'getUserInfo', slug: 'wrong-one' }).expect(404);
        });

        it('should return 404 for wrong action', async () => {
            await request.put('/api/users/0').send({ action: 'wrongAction' }).expect(404);
        });
    });

    describe('patch', () => {
        it('should return 401 for not logged in', async () => {
            await request.patch('/api/users/1').expect(401);
        });

        it('should return 404 for a different user', async () => {
            const token = await loginAsPlayer2();
            await request
                .patch('/api/users/1')
                .send({
                    firstName: 'Some',
                    lastName: 'One',
                    gender: 'male',
                    phone: '1111111111',
                    email: 'some@gmail.com',
                    birthday: '2000-01-01',
                })
                .set('Authorization', token)
                .expect(404);
        });

        it('should return 200 for the same user and update proper fields', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/users/1')
                .set('Authorization', token)
                .send({
                    email: '111@gmail.com',
                    password: '12345678',
                    firstName: 'Dude',
                    lastName: 'Green',
                    gender: 'male',
                    phone: '1111111111',
                    roles: 'player,admin',
                    subscribeForProposals: 1,
                    subscribeForReminders: 1,
                    subscribeForNews: 1,
                    subscribeForBadges: 1,
                    personalInfo: 'some',
                    dominantHand: 'right',
                    racquet: 'Wilson',
                    strings: 'Prince Natural Gut',
                    birthday: '2000-01-01',
                })
                .expect(200);

            const record = await getRecord('users', { id: 1 });
            expect(record).toMatchObject({
                email: 'player1@gmail.com',
                firstName: 'Dude',
                lastName: 'Green',
                gender: 'male',
                slug: 'dude-green',
                phone: '1234567890',
                roles: 'player',
                subscribeForProposals: 1,
                subscribeForReminders: 1,
                subscribeForNews: 1,
                subscribeForBadges: 1,
                personalInfo: 'some',
                dominantHand: 'right',
                racquet: 'Wilson',
                strings: 'Prince Natural Gut',
                birthday: '2000-01-01',
            });
            expect(record.password).toBe('$2a$10$AzAuGMmM6nFAAm9pX8mbKOKnYHxppQ35Vdao2qfQEFIPqqCCJdE/2');
        });
    });

    describe('delete', () => {
        it('should return 405', async () => {
            await request.delete('/api/users/1').expect(405);
        });
    });

    describe('mergeUsers', () => {
        it('should return 422 when user is the same', async () => {
            const token = await loginAsManager();
            await request
                .put('/api/users/0')
                .set('Authorization', token)
                .send({ action: 'mergeUsers', userIdFrom: 2, userIdTo: 2, decision: 'nothing' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The ids are the same');
                });
        });

        it('should return 422 when users are not found', async () => {
            const token = await loginAsManager();
            await request
                .put('/api/users/0')
                .set('Authorization', token)
                .send({ action: 'mergeUsers', userIdFrom: 2929, userIdTo: 2, decision: 'nothing' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Users are not found');
                });
        });

        it('should return 422 when users have the same ladders', async () => {
            const token = await loginAsManager();
            await request
                .put('/api/users/0')
                .set('Authorization', token)
                .send({ action: 'mergeUsers', userIdFrom: 2, userIdTo: 1, decision: 'nothing' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Users have the same active ladders');
                });
        });

        it('should merge two users', async () => {
            const token = await loginAsManager();
            await request
                .put('/api/users/0')
                .set('Authorization', token)
                .send({ action: 'mergeUsers', userIdFrom: 1, userIdTo: 8, decision: 'nothing' })
                .expect(200);

            expect(await getNumRecords('players', { userId: 8 })).toBe(5);
            expect(await getNumRecords('users', { id: 1 })).toBe(0);
        });
    });

    describe('unsubscribe', () => {
        it('should return 422 when there is validation error', async () => {
            await request
                .put('/api/users/1')
                .send({ action: 'unsubscribe', date: 'wrong', hash: 'sdjfksjd' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('should return 422 when hash is wrong', async () => {
            await request
                .put('/api/users/1')
                .send({
                    action: 'unsubscribe',
                    date: dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD'),
                    hash: 'wrong',
                })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The request is broken');
                });
        });

        it('should return 422 when date is old', async () => {
            await request
                .put('/api/users/1')
                .send({
                    action: 'unsubscribe',
                    date: '2020-10-10',
                    hash: '8e6bfe6b21',
                })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The request is expired');
                });
        });

        it('should unsubscribe from all subscriptions', async () => {
            await request
                .put('/api/users/99999')
                .send({
                    action: 'unsubscribe',
                    date: '2020-10-10',
                    hash: 'c06cbd0ef2',
                })
                .expect(200);

            await expectRecordToExist(
                'users',
                { id: 1 },
                { subscribeForProposals: 0, subscribeForNews: 0, subscribeForReminders: 0, subscribeForBadges: 0 }
            );
        });
    });
});

describe('player', () => {
    describe('patch', () => {
        it('should patch a player with readyForFinal field', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/players/2')
                .set('Authorization', token)
                .send({ readyForFinal: 1, isActive: 0 })
                .expect(200);
            await expectRecordToExist('players', { id: 2 }, { readyForFinal: 1, isActive: 1 });
        });

        it('Should throw a validation error', async () => {
            const token = await loginAsPlayer1();
            await request.patch('/api/players/2').set('Authorization', token).send({ readyForFinal: 3 }).expect(422);
        });

        it('Should not patch a player with wrong id', async () => {
            const token = await loginAsPlayer1();
            await request.patch('/api/players/999').set('Authorization', token).send({ readyForFinal: 1 }).expect(422);
        });

        it('Should not patch a player for finished tournament', async () => {
            await runQuery(
                `UPDATE seasons SET endDate="${dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD')} 00:00:00"`
            );
            const token = await loginAsPlayer1();
            await request.patch('/api/players/2').set('Authorization', token).send({ readyForFinal: 1 }).expect(422);
        });

        it('Should not patch a player for not started tournament', async () => {
            await runQuery(`UPDATE seasons SET startDate="${dayjs.tz().add(2, 'day').format('YYYY-MM-DD')} 00:00:00"`);
            const token = await loginAsPlayer1();
            await request.patch('/api/players/2').set('Authorization', token).send({ readyForFinal: 1 }).expect(422);
        });

        it('Should not patch a player who is not active', async () => {
            await runQuery(`UPDATE players SET isActive="0"`);
            const token = await loginAsPlayer1();
            await request.patch('/api/players/2').set('Authorization', token).send({ readyForFinal: 1 }).expect(422);
        });

        it('Should not patch a player for a wrong user', async () => {
            const token = await loginAsPlayer2();
            await request.patch('/api/players/2').set('Authorization', token).send({ readyForFinal: 1 }).expect(422);
        });

        it('Should not add readyForFinal=1 if that user is already in another tournament', async () => {
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=5`);
            const token = await loginAsPlayer2();
            await request.patch('/api/players/1').set('Authorization', token).send({ readyForFinal: 1 }).expect(422);
        });

        it('Should add readyForFinal=2 even if that user is already in another tournament', async () => {
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=5`);
            const token = await loginAsPlayer2();
            await request.patch('/api/players/1').set('Authorization', token).send({ readyForFinal: 2 }).expect(200);
        });

        it('Should flush redis when the readyForFinal is updated', async () => {
            // generate cache
            const url = '/api/tournaments/1?year=2021&season=spring&level=men-35';
            await request.get(url).expect(200);

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            // this patch request should flush the cache
            const token = await loginAsPlayer1();
            await request
                .patch('/api/players/2')
                .set('Authorization', token)
                .send({ readyForFinal: 1, isActive: 0 })
                .expect(200);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe('2000-01-01 00:00:00');
        });
    });

    describe('update', () => {
        it('should switch to the different ladder', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 3 })
                .expect(200);
            await expectRecordToExist('players', { id: 2 }, { isActive: 0 });
            await expectRecordToExist('players', { userId: 1, tournamentId: 3 }, { isActive: 1, changedCount: 1 });
        });

        it('Should throw a validation error', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 'some', to: 'wrong' })
                .expect(422);
        });

        it('Should throw when user is not from this ladder', async () => {
            const token = await loginAsPlayer1();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 3, to: 4 })
                .expect(422);
            expect(result.body.message).toContain('not in this ladder');
        });

        it('Should throw when trying to switch during last two weeks', async () => {
            const dateInTenDays = dayjs.tz().add(10, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate="${dateInTenDays}"`);

            const token = await loginAsPlayer1();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 3 })
                .expect(422);
            expect(result.body.message).toContain('during the last two weeks');
        });

        it('Should throw when user is not active', async () => {
            const token = await loginAsInactivePlayer();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 3 })
                .expect(422);
            expect(result.body.message).toContain('not active in this ladder');
        });

        it('Should throw when the season is over', async () => {
            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00", endDate="2010-01-01 00:00:00"`);

            const token = await loginAsPlayer1();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 3 })
                .expect(422);
            expect(result.body.message).toContain('The season is already over');
        });

        it('Should throw when the user is already in the ladder', async () => {
            const token = await loginAsPlayer2();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 3 })
                .expect(422);
            expect(result.body.message).toContain('already in this ladder');
        });

        it('Should throw when the desired tournament does not exist', async () => {
            const token = await loginAsPlayer1();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 999 })
                .expect(422);
            expect(result.body.message).toContain('There is no desired ladder');
        });

        it('Should throw when the desired tournament has different season', async () => {
            const token = await loginAsPlayer1();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 8 })
                .expect(422);
            expect(result.body.message).toContain('The season is not the same');
        });

        it('Should throw when the user already changed the ladder before', async () => {
            await runQuery(`UPDATE players SET changedCount=1 WHERE id=2`);

            const token = await loginAsPlayer1();
            const result = await request
                .put('/api/players/0')
                .set('Authorization', token)
                .send({ action: 'switchTournament', from: 2, to: 3 })
                .expect(422);
            expect(result.body.message).toContain("You've already switched ladder before");
        });
    });
});

describe('level', () => {
    describe('Permissions', () => {
        checkPermissions({
            serviceName: 'levels',
            permissions: {
                find: { guest: 200, player: 200, manager: 200, admin: 200 },
                // get: has another meaning,
                create: { guest: 401, player: 403, manager: 201, admin: 201 },
                update: { guest: 401, player: 403, manager: 200, admin: 200 },
                patch: { guest: 401, player: 403, manager: 200, admin: 200 },
                delete: { guest: 401, player: 403, manager: 200, admin: 200 },
            },
            id: 5,
            payload: { name: 'Men new', type: 'single' },
            payloadUpdate: { destinationId: 2 },
        });
    });

    it('should not delete a level which is in use', async () => {
        const token = await loginAsAdmin();
        await request.delete('/api/levels/1').set('Authorization', token).expect(400);
    });
});

describe('season', () => {
    const nextYear = new Date().getFullYear() + 1;
    const monday = dayjs.tz(`${nextYear}-10-10`).isoWeekday(1).format('YYYY-MM-DD');

    describe('Permissions', () => {
        checkPermissions({
            serviceName: 'seasons',
            permissions: {
                find: { guest: 200, player: 200, manager: 200, admin: 200 },
                get: { guest: 200, player: 200, manager: 200, admin: 200 },
                create: { guest: 401, player: 403, manager: 201, admin: 201 },
                // update: { guest: 405, player: 405, manager: 405, admin: 405 },
                patch: { guest: 401, player: 403 },
                delete: { guest: 401, player: 403, manager: 200, admin: 200 },
            },
            id: 4,
            payload: { year: nextYear, season: 'summer', startDate: monday, weeks: 9, levels: [1] },
            beforeEach: async () => {
                await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00", endDate="2010-01-01 00:00:00"`);
            },
        });
    });

    describe('create', () => {
        const finishAllSeasons = async () => {
            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00", endDate="2010-01-01 00:00:00"`);
        };

        it('Should create a season', async () => {
            await finishAllSeasons();

            const token = await loginAsAdmin();
            await request
                .post('/api/seasons')
                .set('Authorization', token)
                .send({ year: nextYear, season: 'fall', startDate: monday, weeks: 9, levels: [1] })
                .expect(201);

            const record = await expectRecordToExist('seasons', { year: nextYear, season: 'fall' });
            expect(dayjs.tz(monday).format('YYYY-MM-DD HH:mm:ss')).toBe(record.startDate);
            expect(dayjs.tz(monday).add(9, 'week').format('YYYY-MM-DD HH:mm:ss')).toBe(record.endDate);
        });

        it('Should preserve isFree status', async () => {
            await finishAllSeasons();
            await runQuery(`UPDATE seasons SET isFree=1`);

            const token = await loginAsAdmin();
            await request
                .post('/api/seasons')
                .set('Authorization', token)
                .send({ year: nextYear, season: 'fall', startDate: monday, weeks: 9, levels: [1] })
                .expect(201);

            await expectRecordToExist('seasons', { year: nextYear, season: 'fall' }, { isFree: 1 });
        });

        it('Should throw a validation error when no levels selected', async () => {
            await finishAllSeasons();

            const token = await loginAsAdmin();
            await request
                .post('/api/seasons')
                .set('Authorization', token)
                .send({ year: nextYear, season: 'fall', startDate: monday, weeks: 9, levels: [] })
                .expect(422);
        });

        it('Should not create a season with the same name', async () => {
            await finishAllSeasons();

            const token = await loginAsAdmin();
            await request
                .post('/api/seasons')
                .set('Authorization', token)
                .send({ year: 2022, season: 'spring', startDate: monday, weeks: 9, levels: [1] })
                .expect(422);
        });

        it('Should not create a season with the past date', async () => {
            await finishAllSeasons();

            const token = await loginAsAdmin();
            const result = await request
                .post('/api/seasons')
                .set('Authorization', token)
                .send({
                    year: new Date().getFullYear(),
                    season: 'spring',
                    startDate: dayjs.tz().isoWeekday(1).format('YYYY-MM-DD'),
                    weeks: 9,
                    levels: [1],
                })
                .expect(422);

            expect(result.body.errors.startDate).toContain('Start date should be in the future');
        });

        it('Should not create a season with the date before other seasons', async () => {
            await finishAllSeasons();

            const token = await loginAsAdmin();
            const result = await request
                .post('/api/seasons')
                .set('Authorization', token)
                .send({
                    year: new Date().getFullYear(),
                    season: 'spring',
                    startDate: '2009-07-13',
                    weeks: 9,
                    levels: [1],
                })
                .expect(422);

            expect(result.body.errors.startDate).toContain('The season should start after all other seasons');
        });
    });

    describe('patch', () => {
        const getPrevRecord = async () => {
            const prevRecord = await expectRecordToExist('seasons', { id: 1 });
            prevRecord.weeks = Math.round(dayjs(prevRecord.endDate).diff(dayjs(prevRecord.startDate), 'week', true));
            prevRecord.levels = [1, 2, 3, 4, 5, 6];

            return prevRecord;
        };

        it('Should patch a future season', async () => {
            const prevRecord = await expectRecordToExist('seasons', { id: 5 });

            const token = await loginAsAdmin();
            await request
                .patch('/api/seasons/5')
                .set('Authorization', token)
                .send({
                    ...prevRecord,
                    year: 2025,
                    weeks: 15,
                    levels: [1, 2],
                })
                .expect(200);

            const record = await expectRecordToExist('seasons', { id: 5 });
            expect(record.startDate).toBe(prevRecord.startDate);
            expect(record.endDate).not.toBe(prevRecord.endDate);

            const existedRecord = await getRecord('tournaments', { seasonId: 5, levelId: 2 });
            expect(existedRecord).toBeDefined();

            const deletedRecord = await getRecord('tournaments', { seasonId: 5, levelId: 3 });
            expect(deletedRecord).toBeUndefined();
        });

        it('Should throw a validation error when no levels selected', async () => {
            const prevRecord = await expectRecordToExist('seasons', { id: 5 });

            const token = await loginAsAdmin();
            const result = await request
                .patch('/api/seasons/5')
                .set('Authorization', token)
                .send({ ...prevRecord, weeks: 9, levels: [] })
                .expect(422);

            expect(result.body.errors.levels).toBeDefined();
        });

        it('Should throw when the seasonId is wrong', async () => {
            const token = await loginAsAdmin();
            const result = await request.patch('/api/seasons/999').set('Authorization', token).send({}).expect(422);

            expect(result.body.message).toContain('season does not exist');
        });

        it('Should throw when the season is already finished', async () => {
            const token = await loginAsAdmin();
            const result = await request.patch('/api/seasons/3').set('Authorization', token).send({}).expect(422);

            expect(result.body.message).toContain('cannot change finished season');
        });

        it('Should throw when changing year for the current season', async () => {
            const prevRecord = await getPrevRecord();

            const token = await loginAsAdmin();
            const result = await request
                .patch('/api/seasons/1')
                .set('Authorization', token)
                .send({ ...prevRecord, weeks: 15, year: new Date().getFullYear() + 1 })
                .expect(422);

            expect(result.body.errors.year).toContain('cannot change year');
        });

        it.skip('Should throw when changing season for the current season', async () => {
            const prevRecord = await getPrevRecord();

            const token = await loginAsAdmin();
            const result = await request
                .patch('/api/seasons/1')
                .set('Authorization', token)
                .send({ ...prevRecord, weeks: 15, season: 'winter' })
                .expect(422);

            expect(result.body.errors.season).toContain('cannot change season');
        });

        it.skip('Should throw when changing startDate for the current season', async () => {
            const prevRecord = await getPrevRecord();

            const token = await loginAsAdmin();
            const result = await request
                .patch('/api/seasons/1')
                .set('Authorization', token)
                .send({
                    ...prevRecord,
                    weeks: 15,
                    startDate: dayjs.tz(prevRecord.startDate).subtract(1, 'week').format('YYYY-MM-DD'),
                })
                .expect(422);

            expect(result.body.errors.startDate).toContain('cannot change start date');
        });

        it.skip('Should throw when removing active levels for the current season', async () => {
            const prevRecord = await getPrevRecord();

            const token = await loginAsAdmin();
            const result = await request
                .patch('/api/seasons/1')
                .set('Authorization', token)
                .send({
                    ...prevRecord,
                    weeks: 15,
                    levels: [1, 2, 4],
                })
                .expect(422);

            expect(result.body.errors.levels).toContain('cannot delete these levels');
        });
    });

    it('should not delete a season which is in use', async () => {
        const token = await loginAsAdmin();
        await request.delete('/api/seasons/1').set('Authorization', token).expect(400);
    });
});

describe('tournament', () => {
    describe('Permissions', () => {
        checkPermissions({
            serviceName: 'tournaments',
            permissions: {
                // find: { guest: 405 },
                // get: { guest: 405 },
                create: { guest: 405 },
                update: { guest: 404 },
                patch: { guest: 405 },
                delete: { guest: 405 },
            },
            id: 1,
            payload: {},
        });
    });

    describe('get', () => {
        const url = '/api/tournaments/1?year=2021&season=spring&level=men-35';

        it('Should get tournament info', async () => {
            await request.get(url).expect(200);
        });

        it('Should get tournament info from redis', async () => {
            const result = await request.get(url).expect(200);
            const { startDate } = result.body.data;

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe(startDate);
        });

        it('Should flush redis when the match is created', async () => {
            // generate cache
            await request.get(url).expect(200);

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            // this create request should flush the cache
            const token = await loginAsPlayer1();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({
                    challengerId: 1,
                    acceptorId: 2,
                    score: '6-1 6-1',
                    playedAt: dayjs.tz().format('YYYY-MM-DD 00:01:00'),
                })
                .expect(201);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe('2000-01-01 00:00:00');
        });

        it('Should flush redis when the match is updated', async () => {
            await runQuery(`UPDATE matches SET playedAt="${dayjs.tz().format('YYYY-MM-DD')} 12:00:00" WHERE id=8`);

            // generate cache
            await request.get(url).expect(200);

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            // this update request should flush the cache
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({
                    score: '6-1 6-1',
                    playedAt: dayjs.tz().format('YYYY-MM-DD 00:01:00'),
                })
                .expect(200);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe('2000-01-01 00:00:00');
        });

        it('Should not flush redis when the match for another tournament is updated', async () => {
            await runQuery(`UPDATE matches SET playedAt="${dayjs.tz().format('YYYY-MM-DD')} 12:00:00" WHERE id=8`);

            const anotherUrl = '/api/tournaments/1?year=2021&season=spring&level=men-40';
            const result = await request.get(anotherUrl).expect(200);
            const { startDate } = result.body.data;

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            // this update request should NOT flush the cache
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({
                    score: '6-1 6-1',
                    playedAt: dayjs.tz().format('YYYY-MM-DD 00:01:00'),
                })
                .expect(200);

            const newResult = await request.get(anotherUrl).expect(200);
            expect(newResult.body.data.startDate).toBe(startDate);
        });

        it.skip('Should flush redis when the proposal is created', async () => {
            // generate cache
            await request.get(url).expect(200);

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            const token = await loginAsPlayer1();
            await request
                .post('/api/proposals')
                .set('Authorization', token)
                .send({
                    place: 'Something',
                    playedAt: dayjs().add(2, 'day').format('YYYY-MM-DD 01:40:00'),
                    tournaments: [2],
                })
                .expect(201);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe('2000-01-01 00:00:00');
        });

        it('Should flush redis when the proposal is accepted', async () => {
            // generate cache
            await request.get(url).expect(200);

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            const token = await loginAsPlayer2();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(200);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe('2000-01-01 00:00:00');
        });

        it('Should flush redis when the proposal is deleted', async () => {
            // generate cache
            await request.get(url).expect(200);

            await runQuery(`UPDATE seasons SET startDate="2000-01-01 00:00:00"`);

            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'removeProposal' })
                .expect(200);

            const newResult = await request.get(url).expect(200);
            expect(newResult.body.data.startDate).toBe('2000-01-01 00:00:00');
        });
    });
});

describe('match', () => {
    describe('Permissions', () => {
        checkPermissions({
            serviceName: 'matches',
            permissions: {
                find: { guest: 401, player: 405 },
                get: { guest: 401, player: 405 },
                create: { guest: 401 },
                update: { guest: 401, player: 404 },
                patch: { guest: 401 },
                delete: { guest: 401, player: 405 },
            },
            id: 3,
            payload: {},
        });
    });

    describe('create', () => {
        const date = dayjs.tz().format('YYYY-MM-DD');

        it('Should throw a validation error', async () => {
            const token = await loginAsPlayer1();
            await request.post('/api/matches').set('Authorization', token).send({ score: 'wrong' }).expect(422);
        });

        it('Should create a match', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({
                    challengerId: 1,
                    acceptorId: 2,
                    score: '6-1 6-1',
                    playedAt: date + ' 01:40:00',
                })
                .expect(201);

            const record = await expectRecordToExist('matches', { score: '6-1 6-1' });
            expect(dayjs.tz(date).add(100, 'minute').format('YYYY-MM-DD HH:mm:ss')).toBe(record.playedAt);
            expect(Math.abs(dayjs.tz().diff(dayjs.tz(record.createdAt), 'second'))).toBeLessThan(100);
        });

        it('Should not create a match with wrong challenger', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({
                    challengerId: 999,
                    acceptorId: 2,
                    score: '6-1 6-1',
                    playedAt: date + ' 00:01:00',
                })
                .expect(422);
        });

        it('Should not create a match with wrong acceptor', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 1, acceptorId: 999, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not create a match with challenger and acceptor from different tournament', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 1, acceptorId: 5, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not create a match for current player not from this tournament', async () => {
            const token = await loginAsPlayer8();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 1, acceptorId: 2, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe("You're not in this tournament.");
                });
        });

        it('Should not create a match for the closed season', async () => {
            const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);

            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 1, acceptorId: 2, score: '6-1 6-1', playedAt: date + ' 01:40:00' })
                .expect(422);
        });

        it('Should not create a match for the upcoming tournament', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 8, acceptorId: 9, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not create a match for the user not from the match', async () => {
            const token = await loginAsPlayer3();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 1, acceptorId: 2, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not create a match won by default with wrong score', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({
                    challengerId: 1,
                    acceptorId: 2,
                    score: '6-1 6-1',
                    playedAt: date + ' 01:40:00',
                    wonByDefault: true,
                })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The score for default match is wrong');
                });
        });

        it('Should not create a default match with injury', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({
                    challengerId: 1,
                    acceptorId: 2,
                    score: '6-0 6-0',
                    playedAt: date + ' 01:40:00',
                    wonByDefault: true,
                    wonByInjury: true,
                })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Too many checkboxes');
                });
        });

        it('Should not create a match for the inactive player', async () => {
            const token = await loginAsPlayer2();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 1, acceptorId: 6, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not create a match by the inactive player', async () => {
            const token = await loginAsInactivePlayer();
            await request
                .post('/api/matches')
                .set('Authorization', token)
                .send({ challengerId: 6, acceptorId: 1, score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });
    });

    describe('patch', () => {
        const date = dayjs.tz().format('YYYY-MM-DD');

        it('Should throw a validation error', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({ score: 'wrong', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should patch a match', async () => {
            await runQuery(`UPDATE matches SET playedAt="${date} 12:00:00" WHERE id=8`);
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 01:40:00' })
                .expect(200);

            const record = await expectRecordToExist('matches', { id: 8 }, { score: '6-1 6-1' });
            expect(dayjs.tz(date).add(100, 'minute').format('YYYY-MM-DD HH:mm:ss')).toBe(record.playedAt);
            expect(Math.abs(dayjs.tz().diff(dayjs.tz(record.updatedAt), 'second'))).toBeLessThan(100);
        });

        it('Should not patch a match with wrong id', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/999')
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not patch a match without acceptorId', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/6')
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not patch a match for not participating player', async () => {
            const token = await loginAsPlayer8();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You did not play in this match.');
                });
        });

        it('Should not patch a match for user who did not play in this match', async () => {
            const token = await loginAsPlayer3();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });

        it('Should not patch a match with a wrong score for the default match', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 01:40:00', wonByDefault: true })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The score for default match is wrong');
                });
        });

        it('Should not patch a match with default and injury simultaneously', async () => {
            const token = await loginAsPlayer1();
            await request
                .patch('/api/matches/8')
                .set('Authorization', token)
                .send({ score: '6-0 6-0', playedAt: date + ' 01:40:00', wonByDefault: true, wonByInjury: true })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Too many checkboxes');
                });
        });

        it('Should not patch a match from the final if there is another match later is already scored', async () => {
            const firstMatch = await runQuery(`
                INSERT INTO matches (initial, challengerId, acceptorId, type, finalSpot, score)
                     VALUES (3, 2, 1, 'final', 3, '6-2 6-2')
            `);
            await runQuery(`
                INSERT INTO matches (initial, challengerId, acceptorId, type, finalSpot, score)
                     VALUES (3, 2, 3, 'final', 1, '6-2 6-2')
            `);
            const token = await loginAsPlayer1();
            await request
                // @ts-expect-error query should return object with insert data
                .patch(`/api/matches/${firstMatch.insertId}`)
                .set('Authorization', token)
                .send({ score: '6-1 6-1', playedAt: date + ' 00:01:00' })
                .expect(422);
        });
    });

    describe('delete', () => {
        it('Should delete a match', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/matches/1')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(200);
        });

        it('Should delete a match by admin', async () => {
            const token = await loginAsAdmin();
            await request
                .put('/api/matches/1')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(200);
        });

        it('Should not delete an old match', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/matches/2')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot delete this match.');
                });
        });

        it('Should not delete a match with wrong id', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/matches/999')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe("Match doesn't exist.");
                });
        });

        it('Should not delete a match without all players', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/matches/7')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot delete this match.');
                });
        });

        it('Should not delete a match without score', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/matches/23')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot delete this match.');
                });
        });

        it('Should not delete a match for the final tournament', async () => {
            await runQuery(`UPDATE matches SET type="final" WHERE id=1`);

            const token = await loginAsPlayer1();
            await request
                .put('/api/matches/1')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot delete this match.');
                });
        });

        it('Should not delete a match from another tournament', async () => {
            const token = await loginAsPlayer8();
            await request
                .put('/api/matches/1')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot delete this match.');
                });
        });

        it('Should not delete not my match', async () => {
            const token = await loginAsPlayer3();
            await request
                .put('/api/matches/1')
                .set('Authorization', token)
                .send({ action: 'removeMatch', reason: 'I am tired' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot delete this match.');
                });
        });
    });
});

describe('proposal', () => {
    describe('Permissions', () => {
        const afterTomorrow = dayjs().add(2, 'day');

        checkPermissions({
            serviceName: 'proposals',
            permissions: {
                find: { guest: 401, player: 405 },
                get: { guest: 401, player: 405 },
                // create: { guest: 401, player: 201 },
                update: { guest: 401, player: 422, player2: 200 },
                patch: { guest: 401, player: 405 },
                delete: { guest: 401, player: 405 },
            },
            id: 7,
            payload: { place: 'Something', tournaments: [2], playedAt: afterTomorrow.format('YYYY-MM-DD 01:40:00') },
            payloadUpdate: { action: 'acceptProposal' },
        });
    });

    describe('Create', () => {
        const today = dayjs();

        it('Should throw a validation error', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/proposals')
                .set('Authorization', token)
                .send({ place: 'Something', tournaments: 2, playedAt: 'wrong 01:40:00' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('Should not create proposal for not participating player', async () => {
            const token = await loginAsManager();
            await request
                .post('/api/proposals')
                .set('Authorization', token)
                .send({
                    place: 'Something',
                    tournaments: [2],
                    playedAt: dayjs().add(2, 'day').format('YYYY-MM-DD 01:40:00'),
                })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe("You're not in this tournament.");
                });
        });

        it('Should not allow date to be after the end of the season', async () => {
            const endDate = today.add(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            const proposalDate = today.add(4, 'day').format('YYYY-MM-DD');
            await runQuery(`UPDATE seasons SET endDate="${endDate}" WHERE id=1`);

            const token = await loginAsPlayer1();
            await request
                .post('/api/proposals')
                .set('Authorization', token)
                .send({ place: 'Something', tournaments: [2], playedAt: proposalDate + ' 01:40:00' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The season has already ended.');
                });
        });

        it('Should not allow date to be before the beginning of the season', async () => {
            const startDate = today.add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
            const proposalDate = today.add(1, 'day').format('YYYY-MM-DD');
            await runQuery(`UPDATE seasons SET startDate="${startDate}" WHERE id=1`);

            const token = await loginAsPlayer1();
            await request
                .post('/api/proposals')
                .set('Authorization', token)
                .send({ place: 'Something', tournaments: [2], playedAt: proposalDate + ' 01:40:00' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The season has already ended.');
                });
        });

        it('Should not create a proposal for inactive player', async () => {
            const token = await loginAsInactivePlayer();
            await request
                .post('/api/proposals')
                .set('Authorization', token)
                .send({
                    place: 'Something',
                    tournaments: [2],
                    playedAt: dayjs().add(2, 'day').format('YYYY-MM-DD 01:40:00'),
                })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The player is no longer available for matches.');
                });
        });
    });

    describe('Accept', () => {
        const today = dayjs();

        it('Should not accept wrong proposal', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/999')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });

        it('Should not accept already accepted proposal', async () => {
            const token = await loginAsPlayer2();
            await request
                .put('/api/proposals/8')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });

        it('Should not accept by user who is not in the same tournament', async () => {
            const token = await loginAsManager();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });

        it('Should not accept proposal by challenger', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });

        it('Should not accept old proposal', async () => {
            const oldDate = today.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE matches SET playedAt="${oldDate}" WHERE id=7`);

            const token = await loginAsPlayer2();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });

        it('Should not accept inactive user proposal', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/22')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });

        it('Should not accept proposal by inactive user', async () => {
            const token = await loginAsInactivePlayer();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'acceptProposal' })
                .expect(422);
        });
    });

    describe('Delete', () => {
        it('Should delete my proposal', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/7')
                .set('Authorization', token)
                .send({ action: 'removeProposal' })
                .expect(200);
        });

        it('Should cancel my acceptance', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/9')
                .set('Authorization', token)
                .send({ action: 'removeProposal', reason: 'I am sick' })
                .expect(200);

            await expectRecordToExist('matches', { id: 9 }, { acceptorId: null, acceptedAt: null });
        });

        it('Should not delete proposal with wrong id', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/999')
                .set('Authorization', token)
                .send({ action: 'removeProposal' })
                .expect(422);
        });

        it('Should not delete not my proposal', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/6')
                .set('Authorization', token)
                .send({ action: 'removeProposal' })
                .expect(422);
        });

        it('Should not delete accepted proposal', async () => {
            const token = await loginAsPlayer1();
            await request
                .put('/api/proposals/8')
                .set('Authorization', token)
                .send({ action: 'removeProposal' })
                .expect(422);
        });
    });
});

describe('teams', () => {
    const setSetupWeek = async () => {
        const dateStartThisWeek = dayjs.tz().isoWeekday(1).hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET startDate="${dateStartThisWeek}" WHERE id=1`);
    };
    const generateMatches = async () => {
        await runQuery('UPDATE matches SET challengerMatches=10, acceptorMatches=10');
    };

    describe('Create team', () => {
        it('should create a team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 2, player1: 2, player2: 1, name: 13 })
                .expect(201);

            await expectRecordToExist('teams', { name: 13 });
        });

        it('should return 422 when validation error', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({})
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('should show that the tournament is wrong', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 999, player1: 2, player2: 1 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The tournament is wrong.');
                });
        });

        it('should show that it is not setup week', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 2, player1: 2, player2: 1 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('There is no setup week for the teams.');
                });
        });

        it('should show that players are not eligible to play', async () => {
            await setSetupWeek();

            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 2, player1: 2, player2: 1 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Some players are not eligible to play in Teams.');
                });
        });

        it('should show that players are playing in another team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 2, player1: 2, player2: 3 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Some players are playing in another team.');
                });
        });

        it('should throw when current user is not a captain', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 2, player1: 1, player2: 2 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You have to be a captain.');
                });
        });

        it('Should throw when the name is required', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .post('/api/teams')
                .set('Authorization', token)
                .send({ tournamentId: 2, player1: 2, player2: 1, name: 999 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Name is required.');
                });
        });
    });

    describe('Join any team', () => {
        it('should join any team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/0')
                .set('Authorization', token)
                .send({ action: 'joinAnyTeam', tournamentId: 2, comment: 'Hello' })
                .expect(200);

            await expectRecordToExist('players', { id: 2 }, { joinAnyTeam: 1, joinAnyTeamComment: 'Hello' });
        });

        it('should throw a validation error', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/0')
                .set('Authorization', token)
                .send({ action: 'joinAnyTeam' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('should throw when the current user is not available', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsInactivePlayer();
            await request
                .put('/api/teams/0')
                .set('Authorization', token)
                .send({ action: 'joinAnyTeam', tournamentId: 2 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot join the Player Pool.');
                });
        });

        it('should throw when the current user is already in the Player Pool', async () => {
            await setSetupWeek();
            await generateMatches();
            await runQuery('UPDATE players SET joinAnyTeam=1 WHERE id=2');

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/0')
                .set('Authorization', token)
                .send({ action: 'joinAnyTeam', tournamentId: 2 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You have already sent join request.');
                });
        });
    });

    describe('Ask to join', () => {
        it('should ask to join the team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'askToJoin', comment: 'Hello' })
                .expect(200);
        });

        it('should throw if the team is not found', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'askToJoin' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The team is wrong.');
                });
        });

        it('should throw when the current user is not available', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsInactivePlayer();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'askToJoin' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot send a join request.');
                });
        });

        it('should throw when user already send join request', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request.put('/api/teams/1').set('Authorization', token).send({ action: 'askToJoin' }).expect(200);

            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'askToJoin' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You have already sent a join request to this team.');
                });
        });
    });

    describe('updateTeam', () => {
        it('should update the team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'updateTeam', player2: 1, player3: 2, player5: 4, name: 15 })
                .expect(200);
        });

        it('should throw because of validation error', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'updateTeam', player2: 'sss' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('should throw when the team is wrong', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'updateTeam', player2: 1, player3: 2, name: 15 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The team is wrong.');
                });
        });

        it('should throw because the current user is not the captain', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'updateTeam', player2: 1, player3: 2, name: 15 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You are not a captain.');
                });
        });

        it('should throw when players are not eligible to play', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'updateTeam', player2: 4, player3: 6, name: 15 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Some players are not available to join.');
                });
        });

        it('Should throw when the name is required', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'updateTeam', player2: 4, name: 999 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Name is required.');
                });
        });
    });

    describe('Disband team', () => {
        it('should disband team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'disbandTeam', reason: 'Hello' })
                .expect(200);
        });

        it('should throw for validation errors', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'disbandTeam', reason: 123 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('should throw when team is not found', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'disbandTeam' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The team is wrong.');
                });
        });

        it('should throw current user is not a captain', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'disbandTeam' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You are not a captain.');
                });
        });
    });

    describe('Leave team', () => {
        it('should leave team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer4();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'leaveTeam', reason: 'Hello' })
                .expect(200);
        });

        it('should throw validation error', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer4();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'leaveTeam', reason: 123 })
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                });
        });

        it('should throw when leaving wrong team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer4();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'leaveTeam' })
                .expect((res) => {
                    expect(res.body.message).toBe('The team is wrong.');
                });
        });

        it('should throw if current user is a captain', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'leaveTeam' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You cannot leave as a captain.');
                });
        });

        it('should throw current user is not a member', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'leaveTeam' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You are not a member of the team.');
                });
        });
    });

    describe('Accept member', () => {
        it('should accept member', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'acceptMember', playerId: 1 })
                .expect(200);
        });

        it('should throw for wrong team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'acceptMember', playerId: 1 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The team is wrong.');
                });
        });

        it('should throw if current user is not a captain', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer4();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'acceptMember', playerId: 1 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You are not a captain.');
                });
        });

        it('should throw accepted player is not available', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'acceptMember', playerId: 999 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('This user is not available.');
                });
        });
    });

    describe('Delete candidate', () => {
        it('should delete user from Player Pool', async () => {
            await setSetupWeek();
            await generateMatches();
            await runQuery('UPDATE players SET joinAnyTeam=1 WHERE id=2');

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/0')
                .set('Authorization', token)
                .send({ action: 'deleteCandidate', playerId: 2 })
                .expect(200);
        });

        it('should throw the current user is wrong', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer1();
            await request
                .put('/api/teams/0')
                .set('Authorization', token)
                .send({ action: 'deleteCandidate', playerId: 555 })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The user is wrong.');
                });
        });
    });

    describe('Invite players', () => {
        it('should invite players', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1, 2] })
                .expect(200);
        });

        it('should throw for the wrong team', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/999')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The team is wrong.');
                });
        });

        it('should throw if current user is not a captain', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer4();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You are not a captain.');
                });
        });

        it('should throw if invited players are not free', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [4] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Some players are not available to join.');
                });
        });

        it('should throw if invited players do not exist', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [999] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Some players are not available to join.');
                });
        });

        it('should throw if inviting more than 3 players', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1, 2, 3, 4] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Just three players could be invited.');
                });
        });

        it('should throw if inviting the same player', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1] })
                .expect(200);
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You already invited some of these players.');
                });
        });

        it('should throw if inviting players two times per day', async () => {
            await setSetupWeek();
            await generateMatches();

            const token = await loginAsPlayer3();
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [1] })
                .expect(200);
            await request
                .put('/api/teams/1')
                .set('Authorization', token)
                .send({ action: 'invitePlayers', players: [2] })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You already invited players today.');
                });
        });
    });
});

describe('emails', () => {
    it('Should not be available for the externals', async () => {
        await request.post('/api/emails').send({ email: 'some@gmail.com' }).expect(405);
    });
});

describe('calendars', () => {
    it('Should get the calendar result', async () => {
        await runQuery('UPDATE matches SET practiceType=1 WHERE id=9');

        await request
            .get('/api/calendars/aaaaa')
            .expect(200)
            .expect('Content-Type', 'text/calendar; charset=utf-8')
            .expect('Content-Disposition', 'attachment; filename="calendar.ics"')
            .expect((res) => {
                expect(res.text).toContain('SUMMARY:Practice vs Ben Done');
                expect(res.text).toContain('SUMMARY:Match vs Ben Done');
                expect(res.text).toContain('LOCATION:Winston');
                expect(res.text).toContain('DESCRIPTION:Too late');
                expect(res.text).toContain('SUMMARY:Match vs Ben Done\\, Matthew Burt\\, Cristopher Hamiltonbeach');

                expect(res.text.split('Lake Lynn').length).toBe(2);
                expect(res.text.split('SUMMARY:').length).toBe(8);
            });
    });
});

describe('messages', () => {
    describe('Create', () => {
        const generateMatches = async () => {
            const [match] = await runQuery(
                'SELECT * FROM matches WHERE challengerId=2 AND score IS NOT NULL LIMIT 0, 1'
            );
            for (let i = 0; i < 10; i++) {
                await runQuery(`INSERT INTO matches (initial, challengerId, acceptorId, winner, score, playedAt)
                    VALUES (1, ${match.challengerId}, ${match.acceptorId}, ${match.winner}, "${match.score}", "2020-10-10 10:10:10")`);
            }
        };

        it('Should send a message', async () => {
            await generateMatches();

            // generate old messages
            for (let i = 0; i < 3; i++) {
                await runQuery(`INSERT INTO messages (senderId, recipientId, message) VALUES (1, 3, "Content")`);
            }
            await runQuery(`UPDATE messages SET createdAt="2020-12-12 00:00:00"`);

            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 2, message: 'Hello' })
                .expect(201);

            await expectRecordToExist('messages', { senderId: 1, recipientId: 2, message: 'Hello' });
        });

        it('Should not send a message because of validation error', async () => {
            const token = await loginAsManager();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 'wrong' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid request');
                    expect(res.body.errors.message).toBeDefined();
                });
        });

        it('Should not send a message for not authorized user', async () => {
            await request.post('/api/messages').send({ recipientId: 1, message: 'Hello' }).expect(401);
        });

        it('Should not send a message when there is no recipient', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 9999, message: 'Hello' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The user does not exist.');
                });
        });

        it('Should not send a message when the users are the same', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 1, message: 'Hello' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('The users are the same.');
                });
        });

        it('Should not send a message when the user have not played enough matches', async () => {
            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 2, message: 'Hello' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe(
                        'You are allowed to send messages only after playing at least 10 matches.'
                    );
                });
        });

        it('Should not send a message when the user already reached the week limit', async () => {
            await generateMatches();

            // generate messages
            for (let i = 0; i < 3; i++) {
                await runQuery(`INSERT INTO messages (senderId, recipientId, message) VALUES (1, 3, "Content")`);
            }

            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 2, message: 'Hello' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You are allowed to send only 3 messages per week.');
                });
        });

        it('Should not send a message when the users are not from the same current ladder', async () => {
            await generateMatches();
            await runQuery('UPDATE players SET isActive=0 WHERE userId=2');

            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 2, message: 'Hello' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You can only send messages to players on your current ladders.');
                });
        });

        it('Should not send a message when current user is inactive', async () => {
            await generateMatches();
            await runQuery('UPDATE players SET isActive=0 WHERE userId=1');

            const token = await loginAsPlayer1();
            await request
                .post('/api/messages')
                .set('Authorization', token)
                .send({ recipientId: 2, message: 'Hello' })
                .expect(422)
                .expect((res) => {
                    expect(res.body.message).toBe('You can only send messages to players on your current ladders.');
                });
        });
    });
});

describe('actions', () => {
    describe('Permissions', () => {
        checkPermissions({
            serviceName: 'actions',
            permissions: {
                find: { guest: 405 },
                get: { guest: 405 },
                create: { guest: 422 },
                update: { guest: 500 }, // it is getLink method
                patch: { guest: 405 },
                delete: { guest: 405 },
            },
            payload: { action: 'some' },
        });
    });
});

describe('passwords', () => {
    describe('Permissions', () => {
        checkPermissions({
            serviceName: 'passwords',
            permissions: {
                find: { guest: 405 },
                get: { guest: 405 },
                create: { guest: 201 },
                update: { guest: 422 },
                patch: { guest: 405 },
                delete: { guest: 405 },
            },
            payload: { email: 'player1@gmail.com' },
        });
    });
});

describe('Final tournament', () => {
    it('Do not generate brackets twice', async () => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await Promise.all([
            request.get('/api/tournaments/1?year=2021&season=spring&level=men-35').expect(200),
            request.get('/api/tournaments/1?year=2021&season=spring&level=men-35').expect(200),
        ]);

        const email = await expectRecordToExist('emails', { subject: 'Tournament Matchups' });
        expect(email.html).toContain('Hello, #firstName#!');
        expect(email.html).not.toContain('<html');

        await new Promise((resolve) => setTimeout(resolve, 3000));

        await expectNumRecords('emails', { subject: "You're in the Semifinals of the Men 3.5 Final Tournament!" }, 4);
    }, 20000);
});

describe('cron jobs', () => {
    describe('runActions', () => {
        it('Should not send any reminders', async () => {
            await runActions(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(0);
        });
    });

    describe('generateNews', () => {
        it('Should generate news', async () => {
            await generateNews();

            const total = await getNumRecords('news');
            const manualRecord = await getRecord('news', { isManual: 1 });
            expect(total).toBe(8);
            expect(manualRecord.content).toContain('Great news! Rival Tennis Ladder is coming to the Raleigh area!');
        });
    });

    describe('removeUnverifiedAccounts', () => {
        it('Should remove unverified accounts', async () => {
            await runQuery(
                `INSERT INTO users (email, password, slug) VALUES ('notverified@gmail.com', 'some', 'nonverified')`
            );
            await runQuery(`UPDATE users SET createdAt='2021-07-22 13:10:34' WHERE email='notverified@gmail.com'`);

            expect(await getNumRecords('users', { email: 'notverified@gmail.com' })).toBe(1);
            await removeUnverifiedAccounts(app);
            expect(await getNumRecords('users', { email: 'notverified@gmail.com' })).toBe(0);
        });
    });

    describe('remindForActivity', () => {
        it('Should remind for activity', async () => {
            const dateFourWeeksAgo = dayjs.tz().subtract(4, 'week').format('YYYY-MM-DD 00:00:00');

            await runQuery(`UPDATE players SET createdAt='${dateFourWeeksAgo}' WHERE id=16`);

            await remindForActivity(app);
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(await getNumRecords('emails')).toBe(1);
            const record = await getRecord('emails', { recipientEmail: 'player9@gmail.com' });
            expect(record.subject).toBe('Play Your First Match on the Rival Tennis Ladder');
            expect(record.html).toContain('Andrew Cole');
            await checkImageUrls(record.html, 1);

            // Check that we are not sending reminder once again
            await remindForActivity(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);
    });

    describe('remindForTournament', () => {
        it('Should remind for registration in the tournament', async () => {
            const dateInTenDays = dayjs.tz().add(5, 'day').format('YYYY-MM-DD 00:00:00');
            await runQuery(`UPDATE seasons SET endDate='${dateInTenDays}' WHERE id=1`);
            await overrideConfig({ minMatchesToPlanTournament: 1 });

            await remindForTournament(app);
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(await getNumRecords('emails')).toBe(1);
            const record = await getRecord('emails', { id: 1 });
            expect(record.subject).toBe('Upcoming Final Tournament for the 2021 Spring Ladder');
            expect(record.html).toContain('2021 Spring Ladder');
            expect(record.html).toContain('Men 3.5 Ladder');

            // Check that we are not sending reminder once again
            await remindForTournament(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);
    });

    describe('lastDayRemindForTournament', () => {
        it('Should remind for the tournament tomorrow', async () => {
            const dateInDay = dayjs.tz().add(20, 'hour').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate='${dateInDay}' WHERE id=1`);
            await overrideConfig({ minMatchesToPlanTournament: 2 });

            await lastDayRemindForTournament(app);
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(await getNumRecords('emails')).toBe(1);
            const record = await getRecord('emails', { id: 1 });
            expect(record.subject).toBe('Last Chance to Sign Up for the 2021 Spring Ladder Tournament');
            expect(record.html).toContain('2021 Spring Ladder');
            expect(record.html).toContain('>Men 3.5 page</a>');
            expect(record.html).toContain("We noticed you haven't decided");
            expect(record.recipientEmail.split(',').length).toBe(5);

            // Check that we are not sending reminder once again
            await lastDayRemindForTournament(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);

        it('Should remind for the tournament tomorrow for two groups', async () => {
            const dateInDay = dayjs.tz().add(20, 'hour').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate='${dateInDay}' WHERE id=1`);
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=1`);
            await overrideConfig({ minMatchesToPlanTournament: 2 });

            await lastDayRemindForTournament(app);
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(await getNumRecords('emails')).toBe(2);
            const record = await getRecord('emails', { recipientEmail: 'player2@gmail.com' });
            expect(record.subject).toBe('Confirming Your Availability for the 2021 Spring Ladder Tournament');
            expect(record.html).toContain('2021 Spring Ladder');
            expect(record.html).toContain('Men 3.5 today');
            expect(record.html).toContain('We see you already signed up');
        }, 10000);
    });

    describe('remindForFirstDay', () => {
        it('Should remind for the first day of the season', async () => {
            const dateDayAgo = dayjs.tz().subtract(20, 'hour').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET startDate='${dateDayAgo}' WHERE id=1`);

            await remindForFirstDay(app);
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(await getNumRecords('emails')).toBe(1);
            const record = await getRecord('emails', { id: 1 });
            expect(record.subject).toBe('The Raleigh 2021 Spring Ladder Begins Today!');
            expect(record.html).toContain('the more you play');
            await checkImageUrls(record.html, 2);

            // Check that we are not sending reminder once again
            await remindForFirstDay(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);
    });

    describe('remindForChoosingLadder', () => {
        it('Should remind for choosing ladder', async () => {
            const dateWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE users SET createdAt='${dateWeekAgo}'`);
            await runQuery(`UPDATE users SET isVerified=0 WHERE id=3`);

            await remindForChoosingLadder(app);
            await new Promise((resolve) => setTimeout(resolve, 500));

            expect(await getNumRecords('emails')).toBe(1);
            const record = await getRecord('emails', { recipientEmail: 'playerDuplicated@gmail.com' });
            expect(record.subject).toBe('Pick a Ladder to Start Playing Tennis Today!');
            expect(record.html).toContain('Andrew Cole');
            await checkImageUrls(record.html, 1);

            // Check that we are not sending reminder twice
            await remindForChoosingLadder(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);
    });

    describe('seasonIsOver', () => {
        it('Should send a season summary', async () => {
            const dateDayAgo = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate='${dateDayAgo}' WHERE id=1`);

            await seasonIsOver(app);

            const record = await expectRecordToExist('emails', {
                subject: 'End of 2021 Spring Ladder Stats and Friendly Proposals',
            });

            expect(record.html).toContain('<b>6</b> Matches played');
            expect(record.html).toContain('<b>14</b> Player registrations');
            expect(record.html).toContain('<b>12</b> Proposals sent');
            expect(record.html).toContain('<b>3</b> Rivalries started');
            expect(record.html).toContain('<b>145</b> Ladder points gained');
            expect(record.html).not.toContain('undefined');
            expect(record.recipientEmail.split(',').length).toBe(7);

            // Check that we are not sending summary twice
            await seasonIsOver(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 25000);
    });

    describe('joinNextSeason', () => {
        it('Should send a reminder about next season', async () => {
            const dateMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
            const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            const dateIn19Days = dayjs.tz().add(19, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate='${dateTwoDaysAgo}' WHERE id=1`);
            await runQuery(`UPDATE seasons SET startDate='${dateIn19Days}' WHERE id=5`);
            await runQuery(`UPDATE seasons SET isFree=1`);
            await runQuery(`UPDATE users SET createdAt='${dateMonthAgo}', loggedAt='${dateMonthAgo}'`);
            await runQuery(`UPDATE users SET subscribeForReminders=0 WHERE id=9`);

            await joinNextSeason(app);

            const record = await expectRecordToExist('emails', {
                subject: 'Rejoin the Raleigh Tennis Ladder for Free!',
            });
            expect(record.html).toContain('2022 Spring');
            expect(record.html).not.toContain('undefined');
            expect(record.recipientEmail.split(',').length).toBe(5);

            // Check that we are not sending summary twice
            await joinNextSeason(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);

        it('Should send an offer to join for free', async () => {
            const dateMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
            const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            const dateIn19Days = dayjs.tz().add(19, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate='${dateTwoDaysAgo}' WHERE id=1`);
            await runQuery(`UPDATE seasons SET startDate='${dateIn19Days}' WHERE id=5`);
            await runQuery(`UPDATE users SET createdAt='${dateMonthAgo}', loggedAt='${dateMonthAgo}' WHERE id<=9`);
            await runQuery(`UPDATE users SET subscribeForReminders=0 WHERE id=9`);
            await overrideConfig({ minMatchesToPay: 4 });

            await joinNextSeason(app);
            await new Promise((resolve) => setTimeout(resolve, 5000));

            const email1 = await expectRecordToExist('emails', {
                subject: 'Rejoin the Raleigh Tennis Ladder for Free!',
            });
            expect(email1.html).toContain('2022 Spring');
            expect(email1.html).not.toContain('undefined');
            expect(email1.recipientEmail).toBe('player4@gmail.com,player5@gmail.com,player8@gmail.com');

            const email2 = await expectRecordToExist('emails', {
                subject: 'Sign Up Today for the 2022 Spring Season!',
            });
            expect(email2.html).toContain('2022 Spring');
            expect(email2.html).not.toContain('undefined');
            expect(email2.recipientEmail).toBe('player3@gmail.com');

            // Check that we are not sending summary twice
            await joinNextSeason(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(2);
        }, 10000);

        // TODO: Finish tests for other cases (different days etc.)
    });

    describe('sendFinalScheduleReminder', () => {
        // TODO: write test when reminder is sent (have to set updatedAt somehow)
        it('Should not send any reminders to schedule a final match', async () => {
            const currentWeekday = dayjs.tz().isoWeekday();
            const dateMonday = dayjs
                .tz()
                .subtract(currentWeekday < 4 ? 1 : 0, 'week')
                .isoWeekday(1)
                .hour(0)
                .minute(0)
                .second(0)
                .format('YYYY-MM-DD HH:mm:ss');

            await runQuery(`UPDATE seasons SET endDate='${dateMonday}' WHERE id=1`);
            await runQuery(`
                INSERT INTO matches (initial, challengerId, acceptorId, type, finalSpot)
                     VALUES (1, 1, 2, 'final', 2)`);
            await runQuery(`
                INSERT INTO matches (initial, challengerId, acceptorId, type, finalSpot, score)
                     VALUES (1, 1, 2, 'final', 3, '6-0 6-0')`);

            await sendFinalScheduleReminder(app);

            await new Promise((resolve) => setTimeout(resolve, 2000));
            expect(await getNumRecords('emails')).toBe(0);
        }, 10000);
    });

    describe('remindAboutLastOpenSlot', () => {
        it('Should remind doubles players that just one player needed for a match', async () => {
            const dateTomorrow = dayjs.tz().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
            const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE matches
                SET playedAt='${dateTomorrow}',
                    createdAt='${dateTwoDaysAgo}',
                    place='Millbrook',
                    comment='Flexible on something'
              WHERE id=51`);

            await remindAboutLastOpenSlot(app, { ignoreNightTime: true });
            await expectRecordToExist('actions', { name: 'remindAboutLastOpenSlot' }, { tableId: 51 });

            // Check that email notification is sent
            {
                const record = await expectRecordToExist('emails', {
                    subject: 'Just One Player Needed for Upcoming Doubles Match!',
                });
                expect(record.html).toContain('Ben Done');
                expect(record.html).toContain('Cristopher Hamiltonbeach');
                expect(record.html).toContain('Matthew Burt');
                expect(record.html).toContain('Millbrook');
                expect(record.html).toContain('Flexible on something');
                expect(record.html).not.toContain('undefined');
                expect(record.recipientEmail).toContain('player2@gmail.com');
                expect(record.recipientEmail).toContain('player9@gmail.com');
            }

            // Check that we are not sending the email twice
            await remindAboutLastOpenSlot(app, { ignoreNightTime: true });
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);
    });

    describe('feedbackRequest', () => {
        it('Should request feedback from players played last season but did not join the current one', async () => {
            const dateTwoWeeksAgo = dayjs.tz().subtract(2, 'week').subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET startDate='${dateTwoWeeksAgo}' WHERE id=5`);

            await requestFeedbackForNoJoin(app);

            await new Promise((resolve) => setTimeout(resolve, 2000));
            expect(await getNumRecords('emails')).toBe(1);

            // Check that email notification is sent
            {
                const record = await expectRecordToExist('emails', {
                    subject: 'How Can We Improve? Share Your Thoughts!',
                });
                expect(record.from).toContain('Andrew Cole');
                expect(record.from).toContain('andrew.cole@tennis-ladder.com');
                expect(record.recipientEmail).toContain('player3@gmail.com');
                expect(record.recipientEmail).toContain('player4@gmail.com');
                expect(record.recipientEmail.split(',').length).toBe(2);
                expect(record.html).toContain('I read and respond to every email');
            }

            // Check that we are not sending the email twice
            await requestFeedbackForNoJoin(app);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            expect(await getNumRecords('emails')).toBe(1);
        }, 10000);
    });

    describe('sendNoTeammateReminder', () => {
        it("Should remind doubles players who don't have teammates yet", async () => {
            const dateFourDaysAgo = dayjs.tz().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss');

            // Close current season
            await runQuery(`UPDATE seasons SET endDate="${dateFourDaysAgo}" WHERE id=1`);

            await runQuery('INSERT INTO players SET id=20, userId=1, tournamentId=12, isActive=1');
            await runQuery('INSERT INTO players SET id=23, userId=5, tournamentId=12, isActive=1');
            await runQuery('INSERT INTO players SET id=21, userId=2, tournamentId=12, isActive=1, partnerId=23');

            await runQuery(`UPDATE players SET createdAt="${dateFourDaysAgo}"`);

            await sendMissingTeammateReminder(app);

            // Check that email notification is sent
            {
                const record = await expectRecordToExist('emails', {
                    subject: 'Captain! Your Doubles Team Still Needs Players!',
                });
                expect(record.recipientEmail).toBe('player1@gmail.com');
                expect(record.html).toContain(
                    'You can invite up to 2 teammates to your team by having them join through this link'
                );
            }

            // Check that we are not sending the email twice
            await sendMissingTeammateReminder(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        }, 20000);
    });

    describe('sendTooHighTlrMessage', () => {
        it('Should send warning about too high TLR and add player to the stronger tournament', async () => {
            await runQuery(`UPDATE matches SET challengerMatches=5, challengerElo=395 WHERE id=1`);

            await sendHighProjectedTlrWarning(app);

            await expectRecordToExist('players', { userId: 1, tournamentId: 3 });

            // Check that email notification is sent
            {
                const record = await expectRecordToExist('emails', {
                    subject: "You're Ready for a Stronger Ladder!",
                });
                expect(record.recipientEmail).toBe('player1@gmail.com');
                expect(record.html).toContain('We are adding you to the Men 4.0 ladder.');
            }

            // Check that we are not sending the email twice
            await sendMissingTeammateReminder(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        });

        it('Should send warning about too high TLR', async () => {
            await runQuery(`UPDATE matches SET acceptorMatches=5, acceptorElo=395 WHERE id=1`);

            await sendHighProjectedTlrWarning(app);

            await expectRecordToExist('players', { userId: 2, tournamentId: 3 });

            // Check that email notification is sent
            {
                const record = await expectRecordToExist('emails', {
                    subject: "You're Ready for a Stronger Ladder!",
                });
                expect(record.recipientEmail).toBe('player2@gmail.com');
                expect(record.html).toContain('We recommend that you play on the Men 4.0 ladder.');
            }

            // Check that we are not sending the email twice
            await sendMissingTeammateReminder(app);
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(await getNumRecords('emails')).toBe(1);
        });
    });
});
