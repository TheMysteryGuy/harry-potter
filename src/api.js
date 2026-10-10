import {
  QUESTIONS,
  CHARACTER_PROFILES,
  processQuizResults,
} from "./quiz_engine.js";

export function getQuestions() {
  return Object.keys(QUESTIONS)
    .sort(
      (a, b) =>
        Number(a.slice(1)) -
        Number(b.slice(1))
    )
    .map((questionId) => ({
      id: questionId,
      title: QUESTIONS[questionId].title,
      question: QUESTIONS[questionId].question,
      options: QUESTIONS[questionId].options,
    }));
}

export function getQuizResults(responses) {
  return processQuizResults(responses);
}

export function getCharacterProfile(characterName) {
  const profile = CHARACTER_PROFILES?.[characterName];

  if (!Array.isArray(profile)) {
    return null;
  }

  return profile;
}