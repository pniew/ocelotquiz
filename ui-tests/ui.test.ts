import chromedriver from 'chromedriver';
import { Builder, Key, By } from 'selenium-webdriver';
import { assert } from 'sinon';
import { PageBuilder } from './ui.page';
import pool from 'src/common/database';

console.log('Chromedriver Path:', chromedriver.path);

describe('Chrome Webdriver', async function () {
    async function createBrowser() {
        return await new Builder().forBrowser('chrome').build();
    }

    it('can log in and log out and change user', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getNavLogout().click();
            await page.logInAsAdmin();
            await page.getNavLogout().click();
        } finally {
            await browser.quit();
        }
    });

    it('can add new question and remove question', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getNavAddQuestion().click();
            await page.waitForView('oce-create-question');
            await page.getInputQuestion().sendKeys('Question?');
            for (let i = 0; i < 4; i++) {
                (await page.getInputsAnswer())[i].sendKeys(`Answer...${i}`);
                (await page.getChbxsCorrectAnswer())[i].click();
            }
            await page.getButtonCategory().click();
            await page.getSearchCategory().sendKeys('kinematyka', Key.RETURN);
            await page.getButtonSaveQuestion().click();
            await page.waitForButtonGoToQuestion().click();
            await page.waitForButtonShowDeleteQuestionModal().click();
            await page.waitForButtonDeleteQuestion().click();
        } finally {
            pool.execute('delete from questions where text = \'Question?\'');
            await browser.quit();
        }
    });

    it('has to input at least 1 and 255 characters at most in question field', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getNavAddQuestion().click();

            await page.getButtonSaveQuestion().click();

            await page.getInputQuestion().sendKeys('x'.repeat(254));
            let questionValue = await page.getInputQuestion().getAttribute('value');
            assert.match(questionValue.length, 254);

            await page.getButtonSaveQuestion().click();

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

    it('can start quick quiz', async function () {
        const browser = await createBrowser();
        const page = new PageBuilder(browser);
        try {
            await page.logIn();
            await page.getButtonStartQuickQuiz().click();
            await page.waitForView('oce-start-quiz');
            // await page.getInputQuestionCount().sendKeys(Key.chord(Key.CONTROL, 'a'), '2');

            await page.getButtonBeginQuiz().click();

            await page.waitForView('oce-quiz-question');
            await (await page.findElementWait(By.css('.oce-answer-btn'))).click();

            await page.waitForView('oce-quiz-score');
            await browser.sleep(2000);
        } finally {
            await browser.quit();
        }
    });
});
