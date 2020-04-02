export const questions = [
    { id: 1, text: 'Question1', user: 1, status: 'private', category: 1 },
    { id: 2, text: 'Question2', user: 1, status: 'private', category: 2 },
    { id: 3, text: 'Question3', user: 2, status: 'private', category: 1 }
];

export const answers = [
    { id: 1, text: 'A1', question: 1, correct: 1 },
    { id: 2, text: 'A2', question: 1, correct: 0 },
    { id: 3, text: 'A3', question: 1, correct: 0 },
    { id: 4, text: 'A4', question: 1, correct: 0 },
    { id: 5, text: 'B1', question: 2, correct: 1 },
    { id: 6, text: 'B2', question: 2, correct: 1 },
    { id: 7, text: 'B3', question: 2, correct: 0 },
    { id: 8, text: 'C1', question: 3, correct: 1 },
    { id: 9, text: 'C2', question: 3, correct: 1 },
    { id: 10, text: 'C3', question: 3, correct: 0 }
];

export const questionsAnswers = [
    {
        id: 1,
        text: 'Question1',
        answers: [
            { id: 1, text: 'A1', question: 1, correct: 1 },
            { id: 2, text: 'A2', question: 1, correct: 0 },
            { id: 3, text: 'A3', question: 1, correct: 0 },
            { id: 4, text: 'A4', question: 1, correct: 0 }
        ],
        user: 1,
        status: 'btn-secondary fa-circle',
        statusDescription: 'Pytanie prywatne',
        category: { description: 'string', id: 1, name: 'c1' }
    },
    {
        id: 2,
        text: 'Question2',
        answers: [
            { id: 5, text: 'B1', question: 2, correct: 1 },
            { id: 6, text: 'B2', question: 2, correct: 1 },
            { id: 7, text: 'B3', question: 2, correct: 0 }
        ],
        user: 1,
        category: { description: 'string2', id: 2, name: 'c2' }
    }
];

export const questionEditFormData = {
    question: {
        text: 'Malarz miał namalować na drzwiach numery od 1 do 100. Ile dziewiątek musiał namalować?'
    },
    answer: [
        { id: '49', text: '1' },
        { id: '50', text: '10' },
        { id: '51', text: '11' },
        { id: '52', text: '20', correct: '1' }
    ],
    category: '1'
};

export const questionsParseData = [
    { text: 'Pytanie 1', user: 1, category: '1' },
    { text: 'Pytanie 2', user: 1, category: '1' },
    { text: 'Pytanie 3', user: 1, category: '1' },
    { text: 'Pytanie 4', user: 1, category: '1' },
    { text: 'Pytanie 5', user: 1, category: '1' }
];

export const answersParseData = [
    { text: 'Odpowiedź 1-1', correct: '1', question: 1 },
    { text: 'Odpowiedź 1-2', correct: '0', question: 1 },
    { text: 'Odpowiedź 1-3', correct: '0', question: 1 },
    { text: 'Odpowiedź 1-4', correct: '0', question: 1 },
    { text: 'Odpowiedź 2-1', correct: '0', question: 2 },
    { text: 'Odpowiedź 2-2', correct: '1', question: 2 },
    { text: 'Odpowiedź 2-3', correct: '0', question: 2 },
    { text: 'Odpowiedź 2-4', correct: '0', question: 2 },
    { text: 'Odpowiedź 3-1', correct: '0', question: 3 },
    { text: 'Odpowiedź 3-2', correct: '0', question: 3 },
    { text: 'Odpowiedź 3-3', correct: '1', question: 3 },
    { text: 'Odpowiedź 3-4', correct: '0', question: 3 },
    { text: 'Odpowiedź 4-1', correct: '0', question: 4 },
    { text: 'Odpowiedź 4-2', correct: '0', question: 4 },
    { text: 'Odpowiedź 4-3', correct: '0', question: 4 },
    { text: 'Odpowiedź 4-4', correct: '1', question: 4 },
    { text: 'Odpowiedź 5-1', correct: '0', question: 5 },
    { text: 'Odpowiedź 5-2', correct: '0', question: 5 },
    { text: 'Odpowiedź 5-3', correct: '0', question: 5 },
    { text: 'Odpowiedź 5-4', correct: '0', question: 5 },
    { text: 'Odpowiedź 5-5', correct: '1', question: 5 }
];
