import chromedriver from 'chromedriver';
import { Builder, By, until, Key } from 'selenium-webdriver';
import { assert } from 'sinon';
import { PageBuilder } from './ui.page';

console.log('Chromedriver Path:', chromedriver.path);

describe('Chrome Webdriver', async function () {
    async function createBrowser() {
        return await new Builder().forBrowser('chrome').build();
    }

    it('can log in and log out', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getNavLogout().click();
            await page.waitForLoggedOutPage();
        } finally {
            await browser.quit();
        }
    });

    it('can add new question and remove question', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await browser.findElement(By.css('a[aria-label="Dodaj pytanie"]')).click();
            await page.getInputQuestion().sendKeys('Question?');
            for (let i = 0; i < 4; i++) {
                (await page.getInputsAnswer())[i].sendKeys(`Answer...${i}`);
                (await page.getChbxsCorrectAnswer())[i].click();
            }
            await page.getButtonCategory().click();
            await page.getSearchCategory().sendKeys('matematyka', Key.RETURN);
            await browser.findElement(By.css('button[type="submit"]')).click();
            await browser.wait(until.elementLocated(By.css('*[data-target="#deleteQuestionModal"]')), 1000);
            await browser.findElement(By.css('*[data-target="#deleteQuestionModal"]')).click();
            await browser.wait(until.elementLocated(By.xpath('//*[@id="deleteQuestionModal"]/div/div/div[3]/form/button')), 1000);
            await browser.wait(until.elementIsVisible(browser.findElement(By.xpath('//*[@id="deleteQuestionModal"]/div/div/div[3]/form/button'))), 1000);
            await browser.findElement(By.xpath('//*[@id="deleteQuestionModal"]/div/div/div[3]/form/button')).click();
        } finally {
            await browser.quit();
        }
    });

    it('can input 255 characters at most in question field', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getNavAddQuestion().click();

            await page.getInputQuestion().sendKeys('x'.repeat(254));
            let questionValue = await page.getInputQuestion().getAttribute('value');
            assert.match(questionValue.length, 254);

            await page.getInputQuestion().sendKeys('M');
            questionValue = await page.getInputQuestion().getAttribute('value');
            assert.match(questionValue.length, 255);

            await page.getInputQuestion().sendKeys('XXX');
            questionValue = await page.getInputQuestion().getAttribute('value');
            assert.match(questionValue.length, 255);
        } finally {
            await browser.quit();
        }
    });

    it('can input 255 characters at most in answer fields', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getNavAddQuestion().click();

            const answerInputs = await page.getInputsAnswer();

            await answerInputs[0].sendKeys('x'.repeat(254));
            let questionValue = await answerInputs[0].getAttribute('value');
            assert.match(questionValue.length, 254);

            await answerInputs[0].sendKeys('M');
            questionValue = await answerInputs[0].getAttribute('value');
            assert.match(questionValue.length, 255);

            await answerInputs[0].sendKeys('XXX');
            questionValue = await answerInputs[0].getAttribute('value');
            assert.match(questionValue.length, 255);
        } finally {
            await browser.quit();
        }
    });
});
