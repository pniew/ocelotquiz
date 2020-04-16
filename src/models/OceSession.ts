
export interface OceSession extends Express.Session {
    loggedIn: boolean;
    isAdmin: boolean;
    userId: number;
    quizScore?: QuizScore[];
    error?: { [key: string]: string | number | Object};
    questionAddedId?: number;
}

export interface QuizScore {
    questionId: number,
    correctAnswerId?: number,
    selectedAnswerId?: number,
    started?: number;
}
