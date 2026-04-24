export interface QuestionItem {
  questionId?: string;
  quizId?: string;
  text?: string;
  type?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  marks?: number;
  orderIndex?: number;
}

export interface QuizItem {
  quizId?: string;
  courseId?: string;
  title?: string;
  description?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  isPublished?: boolean;
  questions?: QuestionItem[];
}

export interface AttemptItem {
  attemptId?: string;
  quizId?: string;
  studentId?: string;
  score?: number;
  passed?: boolean;
  startedAt?: string;
  submittedAt?: string;
}

export interface AnswerPayload {
  questionId: string;
  answer: string;
}

export interface SubmitAttemptPayload {
  studentId: string;
  answers: AnswerPayload[];
}

export interface CreateQuizPayload {
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
}

export interface AddQuestionPayload {
  text: string;
  type: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: number;
  orderIndex: number;
}
