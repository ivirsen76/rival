import simplifyHtml from './simplifyHtml';

describe('simplifyHtml()', () => {
    it('Should replace some tags', () => {
        const html = 'Some <strong>more</strong> <strong>stuff</strong> <em>be</em> <em>ready</em>';
        const expectedResult = 'Some <b>more</b> <b>stuff</b> <i>be</i> <i>ready</i>';

        expect(simplifyHtml(html)).toBe(expectedResult);
    });
});
