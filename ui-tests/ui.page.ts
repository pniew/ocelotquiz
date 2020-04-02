import { By, WebDriver, until, Key } from 'selenium-webdriver';

export class PageBuilder {
    constructor(public readonly browser: WebDriver, private timeout: number = 6000) { }

    public setTimeout(timeout: number): PageBuilder {
        this.timeout = timeout;
        return this;
    }

    public async logIn() {
        await this.browser.get('http://localhost:8080/login');
        await this.getInputUsername().sendKeys('Xtry333');
        await this.getInputPassword().sendKeys('12345678', Key.RETURN);
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
        return this.browser.findElements(By.id('categorySelect'));
    }

    public getButtonCategory() {
        return this.browser.findElement(By.css('*[data-id="categorySelect"]'));
    }

    public getSearchCategory() {
        return this.browser.findElement(By.css('*[aria-label="Search"]'));
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
