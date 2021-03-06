import { By, WebDriver, until, Key, Locator } from 'selenium-webdriver';

export class PageBuilder {
    constructor(public readonly browser: WebDriver, private timeout: number = 5000) { }

    public setTimeout(timeout: number): PageBuilder {
        this.timeout = timeout;
        return this;
    }

    public async logIn() {
        await this.browser.get('http://localhost:8080/logout');
        await this.browser.get('http://localhost:8080/login');
        await this.getInputUsername().sendKeys('Xtry333');
        await this.getInputPassword().sendKeys('12345678', Key.RETURN);
        return await this.waitForLoggedInPage();
    }

    public async logInAsAdmin() {
        await this.browser.get('http://localhost:8080/logout');
        await this.browser.get('http://localhost:8080/login');
        await this.getInputUsername().sendKeys('admin');
        await this.getInputPassword().sendKeys('1234', Key.RETURN);
        return await this.waitForLoggedInPage();
    }

    public getNavAddQuestion() {
        return this.browser.findElement(By.css('*[aria-label="Dodaj pytanie"]'));
    }

    public getNavLogout() {
        return this.browser.wait(until.elementLocated(By.css('a[aria-label="Wyloguj"]')), this.timeout);
    }

    public getInputUsername() {
        return this.browser.findElement(By.name('username'));
    }

    public getInputPassword() {
        return this.browser.findElement(By.name('password'));
    }

    public getInputQuestion() {
        return this.browser.wait(until.elementLocated(By.id('questionTextarea')), this.timeout);
    }

    public getInputsAnswer() {
        return this.browser.findElements(By.css('*[aria-label="Treść odpowiedzi"]'));
    }

    public getInputCategory() {
        return this.browser.findElement(By.id('categorySelect'));
    }

    public getInputQuestionCount() {
        return this.browser.findElement(By.css('#questionCount'));
    }

    public getButtonCategory() {
        return this.browser.findElement(By.css('*[data-id="categorySelect"]'));
    }

    public getButtonQuiz() {
        return this.browser.findElement(By.linkText('Quiz'));
    }

    public getButtonBeginQuiz() {
        return this.browser.findElement(By.css('button.oce-form-button'));
    }

    public getButtonStartQuickQuiz() {
        return this.browser.findElement(By.css('a.btn'));
    }

    public async waitForView(viewName: string) {
        const locator = By.css(`*[data-view-name='${viewName}']`);
        // const element = await this.browser.findElement(locator);
        return await this.browser.wait(until.elementLocated(locator), this.timeout);
    }

    public async findElementWait(locator: Locator) {
        return await this.browser.wait(until.elementLocated(locator), this.timeout);
    }

    public waitForButtonGoToQuestion() {
        return this.browser.wait(until.elementLocated(By.linkText('Przejdź do pytania')), this.timeout);
    }

    public waitForButtonShowDeleteQuestionModal() {
        return this.browser.wait(until.elementLocated(By.css('*[data-target="#deleteQuestionModal"]')), this.timeout);
    }

    public waitForButtonDeleteQuestion() {
        const locator = By.xpath('//*[@id="deleteQuestionModal"]/div/div/div[3]/form/button');
        return this.browser.wait(until.elementIsVisible(this.browser.findElement(locator)), this.timeout);
    }

    public getSearchCategory() {
        return this.browser.findElement(By.css('*[aria-label="Search"]'));
    }

    public getButtonSaveQuestion() {
        return this.browser.findElement(By.css('.oce-question-form-button'));
    }

    public getChbxsCorrectAnswer() {
        return this.browser.findElements(By.css('*[aria-label="Poprawna?"]'));
    }

    public waitForLoggedInPage() {
        return this.browser.wait(until.elementLocated(By.xpath('//*[text()[contains(.,"Witaj,")]]')), this.timeout);
    }

    public waitForLoggedOutPage() {
        return this.browser.wait(until.elementLocated(By.xpath('//*[text()[contains(.,"Zaloguj się")]]')), this.timeout);
    }
}

export const loginPage = {
    username: () => By.name('username'),
    password: By.name('password')
};
