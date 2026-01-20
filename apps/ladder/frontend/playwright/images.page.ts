import { test, expect } from './base';
import { restoreDb } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should render match image', async ({ page, common, login }) => {
    await page.goto(
        '/image/match?props=%7B%22match%22%3A%7B%22type%22%3A%22final%22%2C%22challengerId%22%3A14244%2C%22acceptorId%22%3A14171%2C%22challengerSeed%22%3A0%2C%22acceptorSeed%22%3A7%7D%2C%22players%22%3A%7B%2214171%22%3A%7B%22userId%22%3A2%2C%22id%22%3A14171%2C%22firstName%22%3A%22Drew%22%2C%22lastName%22%3A%22Welch%22%2C%22avatar%22%3A%22data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAbFBMVEVMaXFCY33ZuZRtfYdGNjZRV2F9dW9SbIHltoppQTZYPThcPDZvdnjivZTWs41zgIjZt5DtuYolVXxyQTMpLDDWp33froIiTnFHPzjInXeoiW1tWUmOcFldSz29kXB8Y1P7%2B%2Fv8TmswVXLiTmNRCfqmAAAAEXRSTlMA%2FGyFhyBF%2Bfv8xd%2FvvsOrrP6oTsEAAAAJcEhZcwAACxMAAAsTAQCanBgAAALdSURBVFiF7Zdtl6ogFIWxfMF0mjkICAh6q%2F%2F%2FH%2B8CtLRyBPt2190fcnR5Hvc%2BHMZC6L%2FilGcf1qdVk56ybA8mT09VVTZN05RNU5Wn6PqTK54pjQNk1VO9tRKVJH124BkRPtJ3gKgs%2BRohnFG%2BC%2BEvljExBiYnMQ4AvIywUToCPEv6CQnuRPdCAGCOkQXm6N4QAHAXmOTUNOVbAgCUYYiqadQaom%2BakJ1SrpuwNqogxLCO0IEIuY5QYYhynQAsDoHntdNJGYQYXO91Z0xnJ9sOt%2F1b9w4RtCLdIKiXGFyZ1I8LZhuRpePNQrg6MWgzP6c03Rrx1N6uJHPqxyrR%2B3Op7IWt%2Bawppcr2jjMbwSPsKrsdjxWltN5AYKYpBuCDMZ0EEANjgwCQnTGaA2CqGN5CgKR2hHqOpcZgNIA2AFpi3tutQxlsI5h1MUkoACVm40F5AAKEW0knSTkAsx%2FTgAsIQWgz2WBC24O577ueqiAE74SynZOaDu75TJieA%2FC%2BoxpvIw52Pf000a7nfhzG8RSDtP4OGwh0sM9hTPaScQzuTcCA%2B6MbjU0CQmixuzHnix0LAQBk27GurUZ4ne%2F3czzqsapnFKLD%2FYniz6ju7iykE2iWxIjOyZi4HOhhQ4lRKtIEetjQt8vlcrnpWBMI5XdGf7tcbvc9g%2FNgBLpHWSo4xjSjLyMRRUCzLHtSjPpZvop%2B0A6dH7sD87CpfNbZbnTOudvx%2BxBf%2Fr%2BFE%2F%2FahwDA2LqweXYjHopEZN91crUvs4VwktTfYT8GjgUhhLQvX9lw2xJCiuM2ILEAQtrkGVE7BCHJ75DMOXCItl4S1EiwTn6Jk48WPKOYfW3jkwdvZHXW88dNjtEWyjWVq%2Fo6JxBCjiEE4iBte726w5JAyFsf2SzFAvJab7O860dBolS8Eo5xhHftSGIRyccmyIuNIh7x1I0snkBI9mkOQr4%2FzUFI%2Fdl6vK4J2aV%2FE1Hski%2F%2BC39OpakV%2FkPcAAAAAElFTkSuQmCC%22%7D%2C%2214244%22%3A%7B%22userId%22%3A1%2C%22id%22%3A14244%2C%22firstName%22%3A%22Saad%22%2C%22lastName%22%3A%22Masood%22%2C%22avatar%22%3A%22%22%7D%7D%2C%22emulateMyMatch%22%3Atrue%7D'
    );

    await expect(common.body).toContainText('Saad Masood');
    await expect(common.body).toContainText('Drew Welch7');
    await expect(common.body).toContainText('Schedule');
    await expect(common.body).toContainText('Score');
});
