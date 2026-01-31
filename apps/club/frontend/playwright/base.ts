/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';
import { Common } from './poms/Common';
import { Login } from './poms/Login';
import { Register } from './poms/Register';
import { Overview } from './poms/Overview';
import { Homepage } from './poms/Homepage';
import { Wallet } from './poms/Wallet';
import { Match } from './poms/Match';
import { DoublesTeam } from './poms/DoublesTeam';
import { TopMenu } from './poms/TopMenu';
import { Proposal } from './poms/Proposal';
import { SideMenu } from './poms/SideMenu';
import { Changelog } from './poms/Changelog';
import { Feedback } from './poms/Feedback';
import { Complaint } from './poms/Complaint';
import { Levels } from './poms/Levels';
import { Seasons } from './poms/Seasons';
import { User } from './poms/User';
import { Team } from './poms/Team';
import { Form } from './poms/Form';

type MyFixture = {
    common: Common;
    login: Login;
    register: Register;
    overview: Overview;
    homepage: Homepage;
    wallet: Wallet;
    match: Match;
    doublesTeam: DoublesTeam;
    topMenu: TopMenu;
    proposal: Proposal;
    sideMenu: SideMenu;
    changelog: Changelog;
    feedback: Feedback;
    complaint: Complaint;
    levels: Levels;
    seasons: Seasons;
    user: User;
    team: Team;
    form: Form;
};

export const test = base.extend<MyFixture>({
    common: async ({ page }, use) => {
        await use(new Common(page));
    },
    login: async ({ page }, use) => {
        await use(new Login(page));
    },
    register: async ({ page }, use) => {
        await use(new Register(page));
    },
    overview: async ({ page }, use) => {
        await use(new Overview(page));
    },
    homepage: async ({ page }, use) => {
        await use(new Homepage(page));
    },
    wallet: async ({ page }, use) => {
        await use(new Wallet(page));
    },
    match: async ({ page }, use) => {
        await use(new Match(page));
    },
    doublesTeam: async ({ page }, use) => {
        await use(new DoublesTeam(page));
    },
    topMenu: async ({ page }, use) => {
        await use(new TopMenu(page));
    },
    proposal: async ({ page }, use) => {
        await use(new Proposal(page));
    },
    sideMenu: async ({ page }, use) => {
        await use(new SideMenu(page));
    },
    changelog: async ({ page }, use) => {
        await use(new Changelog(page));
    },
    feedback: async ({ page }, use) => {
        await use(new Feedback(page));
    },
    complaint: async ({ page }, use) => {
        await use(new Complaint(page));
    },
    levels: async ({ page }, use) => {
        await use(new Levels(page));
    },
    seasons: async ({ page }, use) => {
        await use(new Seasons(page));
    },
    user: async ({ page }, use) => {
        await use(new User(page));
    },
    team: async ({ page }, use) => {
        await use(new Team(page));
    },
    form: async ({ page }, use) => {
        await use(new Form(page));
    },
});

export { expect, Page };
