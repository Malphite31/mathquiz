
export interface Question {
  id: string;
  text: string;
  answer: string;
}

export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
}
