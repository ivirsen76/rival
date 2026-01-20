import searchReferrer from './searchReferrer';

describe('searchReferrer()', () => {
    const list = [
        {
            id: 1,
            firstName: 'Igor',
            lastName: 'Eremeev',
            email: 'ivirsen@GMAIL.com',
            phone: '0987654321',
            referralCode: '12345',
        },
        {
            id: 2,
            firstName: 'Andrew',
            lastName: 'Cole',
            email: 'dcole1337@gmail.com',
            phone: '1234567999',
            referralCode: '12345',
        },
        {
            id: 3,
            firstName: 'Zamir',
            lastName: 'Ahmad',
            email: 'theahmad@bellsouth.net',
            phone: '9197491619',
            referralCode: '12346',
        },
        {
            id: 4,
            firstName: 'Dwayne',
            lastName: 'Ledford',
            email: 'ledforddwayne@yahoo.com',
            phone: '9198473513',
            referralCode: '12347',
        },
        {
            id: 5,
            firstName: 'Terry',
            lastName: 'Kemp',
            email: 'go-deacs@nc.rr.com',
            phone: '9197822720',
            referralCode: '12348',
        },
        {
            id: 6,
            firstName: 'Tim',
            lastName: 'DySard',
            email: 'tim.dysard@gmail.com',
            phone: '9196085540',
            referralCode: '12349',
        },
        {
            id: 7,
            firstName: 'Daniel',
            lastName: 'Simon',
            email: 'schlisp@bellsouth.net',
            phone: '9192558528',
            referralCode: '12301',
        },
        {
            id: 8,
            firstName: 'Craig',
            lastName: 'Isdahl',
            email: 'craig@dashsystems.com',
            phone: '9198891358',
            referralCode: '12302',
        },
        {
            id: 9,
            firstName: 'Paul',
            lastName: 'Tillman',
            email: 'jamiehube@hotmail.com',
            phone: '1234567890',
            referralCode: '12303',
        },
        {
            id: 10,
            firstName: 'Paul',
            lastName: 'Tillman',
            email: 'pjtillman@hotmail.com',
            phone: '1234567890',
            referralCode: 'abcde',
        },
    ];

    const variants = [
        ['Igor Eremeev', [1]],
        ['igor eremeev', [1]],
        ['igor  eremeev', [1]],
        [' igor  eremeev ', [1]],
        ['Igor Eremeev Jr', []],
        ['Igor', []],
        ['Paul Tillman', [9, 10]],
        [' paul  tillman ', [9, 10]],
        ['ivirsen@gmail.com', [1]],
        [' ivirsen@gmail.com ', [1]],
        [' IVirsen@gmail.com ', [1]],
        ['ivirsen@gmail.net', []],
        ['0987654321', [1]],
        [' 0987654321 ', [1]],
        ['098-765-4321', [1]],
        [' 098-765-4321 ', [1]],
        ['0987654321s', []],
        ['1234567890', [9, 10]],
        [' 123- 4567-890 ', [9, 10]],
        ['12345', [1, 2]],
        ['12345 ', [1, 2]],
        [' 12345 ', [1, 2]],
        [' 12346 ', [3]],
        [' 99999 ', []],
        [' abCDe ', [10]],
    ];

    for (const variant of variants) {
        const [search, ids] = variant;

        it(`Should return right search for "${search}"`, () => {
            const result = searchReferrer(list, search);
            expect(result.map(item => item.id)).toEqual(ids);
        });
    }
});
