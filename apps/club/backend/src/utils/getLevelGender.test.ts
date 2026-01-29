import getLevelGender from './getLevelGender';

describe('getLevelGender', () => {
    it('Should return male', () => {
        expect(getLevelGender("Men's 3.5")).toBe('male');
        expect(getLevelGender('Something')).toBe('male');
    });

    it('Should return female', () => {
        expect(getLevelGender("Women's 3.5")).toBe('female');
        expect(getLevelGender("women's 3.5")).toBe('female');
    });
});
