export const questions = [
    { id: 1, text: 'Question1', user: 1, status: 'private', category: 1 },
    { id: 2, text: 'Question2', user: 1, status: 'private', category: 1 },
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
        user: 1
    },
    {
        id: 2,
        text: 'Question2',
        answers: [
            { id: 5, text: 'B1', question: 2, correct: 1 },
            { id: 6, text: 'B2', question: 2, correct: 1 },
            { id: 7, text: 'B3', question: 2, correct: 0 }
        ],
        user: 1
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
    ]
};
