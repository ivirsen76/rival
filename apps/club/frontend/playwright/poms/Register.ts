import { expect, type Locator, type Page } from '@playwright/test';
import { expectRecordToExist } from '@rival/club.backend/src/db/helpers';
import { Common } from './Common';

export class Register {
    readonly common: Common;
    readonly page: Page;
    readonly area: Locator;
    readonly submitPlayerButton: Locator;
    readonly registerButton: Locator;
    readonly globalRegisterButton: Locator;
    readonly goToCheckoutButton: Locator;
    readonly confirmOrderButton: Locator;
    readonly confirmOrderAndMakePaymentButton: Locator;
    readonly pickLadderButton: Locator;
    readonly goToLadderButton: Locator;
    readonly spring2021: Locator;
    readonly spring2022: Locator;
    readonly seasonBlock: Locator;
    readonly changeSeasonLink: Locator;
    readonly changePlayerLink: Locator;
    readonly changeLadderLink: Locator;
    readonly totalSum: Locator;
    readonly emailVerificationCodeField: Locator;
    readonly termsAndConditionsLink: Locator;
    readonly signInLink: Locator;
    readonly strongReasonLink: Locator;
    readonly reasonField: Locator;
    readonly resendEmailLink: Locator;
    readonly friendSpinner: Locator;
    readonly friendField: Locator;
    readonly email1Field: Locator;
    readonly email2Field: Locator;
    readonly partnerInfoField: Locator;
    readonly teamNameField: Locator;

    // Player locators
    readonly firstNameField: Locator;
    readonly lastNameField: Locator;
    readonly emailField: Locator;
    readonly phoneField: Locator;
    readonly passwordField: Locator;
    readonly agreeCheckbox: Locator;
    readonly zipField: Locator;

    // Stripe locators
    readonly stripeCardSection: Locator;
    readonly stripeCardNumberField: Locator;
    readonly stripeCardExpiryField: Locator;
    readonly stripeCardCvcField: Locator;
    readonly stripeBillingNameField: Locator;
    readonly stripeBillingPostalCodeField: Locator;
    readonly stripeSubmitButton: Locator;

    // Messages
    readonly noPaymentInformationMessage: string;
    readonly tooHighTlrMessage: string;
    readonly tooHighTlrDiscountMessage: string;
    readonly refundForNoTeamMessage: string;

    constructor(page: Page) {
        this.common = new Common(page);

        this.page = page;
        this.area = page.locator('[data-register-area]');
        this.submitPlayerButton = page.getByRole('button', { name: 'Submit' });
        this.registerButton = page.getByRole('button', { name: 'Register' });
        this.globalRegisterButton = page.locator('#registerButton');
        this.goToCheckoutButton = page.getByRole('button', { name: 'Go to checkout' });
        this.confirmOrderButton = page.getByRole('button', { name: 'Confirm order' });
        this.confirmOrderAndMakePaymentButton = page.getByRole('button', { name: 'Confirm order and make a payment' });
        this.pickLadderButton = page.getByRole('button', { name: "Let's pick a ladder to play" });
        this.goToLadderButton = page.getByRole('button', { name: 'Go to the Ladder' });
        this.spring2021 = page.getByRole('button', { name: '2021 Spring' });
        this.spring2022 = page.getByRole('button', { name: '2022 Spring' });
        this.seasonBlock = page.locator('[data-stage-season]');
        this.changeSeasonLink = page.locator('[data-stage-season] a').getByText('Change');
        this.changePlayerLink = page.locator('[data-stage-player] a').getByText('Change');
        this.changeLadderLink = page.locator('[data-stage-tournaments] a').getByText('Change');
        this.totalSum = page.locator('[data-total-sum]');
        this.emailVerificationCodeField = page.locator('input[name="code"]');
        this.termsAndConditionsLink = this.area.getByRole('link', { name: 'Terms & Conditions' });
        this.signInLink = this.area.locator('a').getByText('Sign in');
        this.strongReasonLink = page.getByRole('link', { name: 'Have a strong reason' });
        this.reasonField = page.locator('textarea[name="reason"]');
        this.resendEmailLink = page.getByRole('link', { name: 'Resend the email' });
        this.friendSpinner = page.locator('[data-spinner="friend"]');
        this.friendField = page.locator('input[name="friend"]');
        this.email1Field = this.common.modal.locator('input[name="email1"]');
        this.email2Field = this.common.modal.locator('input[name="email2"]');
        this.partnerInfoField = this.common.modal.locator('textarea[name="partnerInfo"]');
        this.teamNameField = this.common.modal.locator('input[name="teamName"]');

        // Player locators
        this.firstNameField = page.locator('input[name="firstName"]');
        this.lastNameField = page.locator('input[name="lastName"]');
        this.emailField = page.locator('input[name="email"]');
        this.phoneField = page.locator('input[name="phone"]');
        this.passwordField = page.locator('input[name="password"]');
        this.agreeCheckbox = page.locator('input[name="agree"]');
        this.zipField = page.locator('input[name="zip"]');

        // Stripe locators
        this.stripeCardSection = page.getByTestId('card-accordion-item');
        this.stripeCardNumberField = page.locator('input[name=cardNumber]');
        this.stripeCardExpiryField = page.locator('input[name=cardExpiry]');
        this.stripeCardCvcField = page.locator('input[name=cardCvc]');
        this.stripeBillingNameField = page.locator('input[name=billingName]');
        this.stripeBillingPostalCodeField = page.locator('input[name=billingPostalCode]');
        this.stripeSubmitButton = page.locator('[data-testid="hosted-payment-submit-button"]');

        // Messages
        this.noPaymentInformationMessage = 'We do not gather any user payment information.';
        this.tooHighTlrMessage = "you won't be able to play in the Final Tournament";
        this.tooHighTlrDiscountMessage = 'You will receive a $10 discount due to this limitation.';
        this.refundForNoTeamMessage = 'refund the payment for this ladder.';
    }

    public async goto() {
        await this.page.goto('/register');
    }

    public getLadderCheckbox(name: string) {
        return this.page.locator('label').getByText(name);
    }

    public getFreeLadderBadge(code: string) {
        return this.page.locator(`[data-free-level="${code}"]`);
    }

    public async submitCardCredentials() {
        await this.stripeCardSection.click();
        await this.stripeCardNumberField.fill('4242 4242 4242 4242');
        await this.stripeCardExpiryField.fill('12/27');
        await this.stripeCardCvcField.fill('123');
        await this.stripeBillingNameField.fill('Name Surname');
        await this.stripeBillingPostalCodeField.fill('27560');
        await this.stripeSubmitButton.click();
    }

    public async verifyEmail(email: string) {
        const emailSent = await expectRecordToExist('emails', { recipientEmail: email });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await this.emailVerificationCodeField.fill(emailVerificationCode);
    }

    public async playAnotherLadder(reason: string) {
        await this.strongReasonLink.click();
        await expect(this.common.modal).toContainText("Describe why you'd like to join another ladder");
        await this.reasonField.fill(reason);
        await this.common.modalSubmitButton.click();
    }
}
