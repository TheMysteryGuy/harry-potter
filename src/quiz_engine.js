/**
 * ========================================================================
 *              V4.0 PERSONALITY-MATCHING QUIZ PRODUCTION ENGINE
 * ========================================================================
 * Filename: quiz_engine.js
 *
 * Browser-safe production release
 *
 * System Specifications:
 *   - 20 Questions
 *   - 5 Answer Choices per Question (A-E)
 *   - 8 Personality Traits
 *   - 24 Core Character Profiles
 *   - 800 scoring-matrix cells
 *   - Question-space calibration
 *   - Character-profile calibration
 *   - 90% Mean-Centred Pearson Shape Similarity
 *   - 10% Bounded Euclidean Proximity
 *   - Character-space ranking calibration
 *   - Deterministic alphabetical tie-breaking
 *   - Zero-variance protection
 *   - Production integrity verification
 *
 * V4.0
 *   - Uses the V3.2 question set
 *   - Uses the V3.2 scoring matrix
 *   - Calibrates every question independently across its five answers
 *   - Standardises character profiles into the same internal trait space
 *   - Applies empirically calibrated character-space offsets
 *   - Corrects unequal character "territory" in attainable answer space
 *   - Preserves the public question/matrix/profile API
 *   - No Express dependency
 *   - No HTTP/API server dependency
 *   - Safe to import directly from a Vite/React frontend
 *
 * IMPORTANT:
 *
 *   Character-space offsets are a RANKING calibration only.
 *
 *   They do NOT alter:
 *     - questions
 *     - answer choices
 *     - scoring weights
 *     - trait scaling
 *     - character profiles
 *     - user's trait vector
 *     - shape similarity
 *     - proximity similarity
 *
 *   The raw hybrid score is the public similarity score:
 *
 *     0.90 * shape similarity + 0.10 * proximity similarity
 *
 *   The calibrated ranking score is:
 *
 *     raw hybrid score + character calibration offset
 *
 *   The calibrated ranking score is intentionally NOT presented as the
 *   user's match percentage because additive offsets can move it outside
 *   the mathematical 0-1 similarity range.
 * ========================================================================
 */

 'use strict';


 // ========================================================================
 // 1. CONSTANTS AND ARCHITECTURE DEFINITIONS
 // ========================================================================
 
 const TRAITS = Object.freeze([
   'Courage',
   'Loyalty',
   'Curiosity',
   'Independence',
   'Ambition',
   'Imagination',
   'Spontaneity',
   'Principles',
 ]);
 
 const ANSWER_IDS = new Set([
   'A',
   'B',
   'C',
   'D',
   'E',
 ]);
 
 const QUESTION_IDS = new Set(
   Array.from(
     { length: 20 },
     (_, index) => `Q${index + 1}`
   )
 );
 
 const SCALING_FACTORS = Object.freeze({
   Courage: 1.697,
   Loyalty: 1.2105,
   Curiosity: 1.0747,
   Independence: 1.005,
   Ambition: 0.9504,
   Imagination: 0.8238,
   Spontaneity: 1.083,
   Principles: 1.1108,
 });
 
 const EXPECTED_QUESTION_COUNT = 20;
 const EXPECTED_ANSWER_COUNT = 5;
 const EXPECTED_TRAIT_COUNT = 8;
 const EXPECTED_CHARACTER_COUNT = 24;
 const EXPECTED_MATRIX_CELL_COUNT = 800;
 
 const SHAPE_WEIGHT = 0.9;
 const PROXIMITY_WEIGHT = 0.1;
 
 const ZERO_VARIANCE_SHAPE_SIMILARITY = 0.5;
 
 
 // ========================================================================
 // 2. CHARACTER-SPACE RANKING CALIBRATION
 // ========================================================================
 //
 // These offsets were fitted against a 300,000-response random baseline.
 //
 // They correct unequal character "territory" in the matching space.
 //
 // CRITICAL ARCHITECTURE:
 //
 //   These values affect ONLY ranking.
 //
 //   They are NOT part of the public similarity percentage.
 //
 // ========================================================================
 

 const CHARACTER_MATCH_OFFSETS = Object.freeze({
  'Alastor Moody': 0.049227,
  'Albus Dumbledore': -0.103727,
  'Arthur Weasley': -0.067558,
  'Cedric Diggory': 0.008101,
  'Dobby': 0.025589,
  'Draco Malfoy': 0.010079,
  'Fred Weasley': 0.024592,
  'George Weasley': 0.010219,
  'Ginny Weasley': 0.034519,
  'Harry Potter': 0.029631,
  'Hermione Granger': -0.049359,
  'James Potter': 0.007803,
  'Lily Potter': 0.115569,
  'Luna Lovegood': 0.000983,
  'Minerva McGonagall': 0.019811,
  'Molly Weasley': -0.021939,
  'Neville Longbottom': 0.088405,
  'Newt Scamander': -0.044377,
  'Nymphadora Tonks': -0.012008,
  'Remus Lupin': -0.109594,
  'Ron Weasley': -0.031152,
  'Rubeus Hagrid': 0.011585,
  'Severus Snape': 0.037750,
  'Sirius Black': -0.034150,
});
 
 // ========================================================================
 // 3. PUBLIC QUESTION DATABASE
 // ========================================================================
 

 const QUESTIONS = Object.freeze({

  Q1: {
    title: 'The turning point',
    question:
      'Your group reaches a crossroad in a project, and nobody knows which direction will work best. What is your instinct?',
    options: {
      A: 'Choose a direction and get everyone moving.',
      B: 'Take a little time to work out which choice feels right.',
      C: 'Gather enough information to compare the options.',
      D: 'Ask someone whose judgement I value.',
      E: 'Consider which option best fits my values and long-term priorities.',
    },
  },

  Q2: {
    title: 'First attempt',
    question:
      'You are given an unfamiliar challenge with very little guidance. How would you approach it?',
    options: {
      A: 'Start experimenting and learn through experience.',
      B: 'Work out a sensible approach before diving in.',
      C: 'Find out how similar challenges have been tackled.',
      D: 'See whether a friend would like to tackle it alongside me.',
      E: 'Set a clear goal and choose a sensible, responsible way to reach it.',
    },
  },

  Q3: {
    title: 'Defending an idea',
    question:
      'During a discussion, someone challenges an idea you care about. What would you be most likely to do?',
    options: {
      A: 'Stand by my view and explain why I believe in it.',
      B: 'Listen carefully and try to understand their perspective.',
      C: 'Look for facts that help establish which view is better supported.',
      D: 'Find the points we can agree on and build from there.',
      E: 'Think carefully about the strongest arguments on both sides.',
    },
  },

  Q4: {
    title: 'Someone needs you',
    question:
      'A friend is having a difficult time just when you have a lot on your own plate. What matters most in your response?',
    options: {
      A: 'Step in straight away rather than leave them struggling.',
      B: 'Make sure they know I will be there for them.',
      C: 'Work out what help would be most useful and how to provide it responsibly.',
      D: 'Stay alongside them and make sure they feel supported.',
      E: 'Think about how I can help without making the situation harder.',
    },
  },

  Q5: {
    title: 'The rulebook',
    question:
      'You discover that a rule everyone follows is producing an unfair outcome. What would you prioritise?',
    options: {
      A: 'Challenge the rule, even if speaking up takes courage.',
      B: 'Find a fairer arrangement that people can accept.',
      C: 'Investigate why the rule was introduced and what it was meant to achieve.',
      D: 'Make sure the people affected are listened to and treated fairly.',
      E: 'Propose a clear, workable change to the rule.',
    },
  },

  Q6: {
    title: 'A day of your own',
    question:
      'You have a completely free day. Which possibility appeals most?',
    options: {
      A: 'Try an activity that gets me out of my comfort zone.',
      B: 'Spend the day with people who matter to me.',
      C: 'Dive into a subject I have always wanted to understand.',
      D: 'Create something of my own, just to see where the idea goes.',
      E: 'Make progress on something I really want to achieve.',
    },
  },

  Q7: {
    title: 'The big opportunity',
    question:
      'You are offered a chance to take part in something exciting, but the outcome is uncertain. How would you respond?',
    options: {
      A: 'Take the opportunity and see what I can make of it.',
      B: "I'd be more willing to take the chance if people I care about were counting on me.",
      C: 'Investigate the possible problems before committing.',
      D: 'Look for a way to take part while keeping the risks manageable.',
      E: 'Weigh up the possible rewards against what I might lose.',
    },
  },

  Q8: {
    title: 'Everything at once',
    question:
      'A deadline is approaching, several things go wrong, and everyone is waiting for the next move. What comes naturally to you?',
    options: {
      A: 'Put extra effort in and push through the challenge.',
      B: 'Make sure everyone is supported and treated fairly.',
      C: 'Identify what has gone wrong and what needs attention first.',
      D: 'Think on my feet and respond to whatever happens next.',
      E: 'Take the lead, assign priorities and get the group organised.',
    },
  },

  Q9: {
    title: 'The unexplained',
    question:
      'You notice an unusual pattern that nobody else has been able to explain. What catches your attention first?',
    options: {
      A: 'The chance to investigate it for myself.',
      B: 'Ask someone I trust to help me investigate what might be going on.',
      C: 'Finding reliable evidence that explains the pattern.',
      D: 'Imagining different explanations that could account for it.',
      E: 'Wondering where the discovery might lead if I pursue it.',
    },
  },

  Q10: {
    title: 'After the finish line',
    question:
      'You complete a demanding project that took weeks of effort. What would feel most rewarding?',
    options: {
      A: 'Knowing I was brave enough to try, and understanding what the challenge taught me.',
      B: 'Celebrating the result with the people who helped me.',
      C: 'Understanding which decisions and methods made it successful.',
      D: 'Having a new idea about what I could attempt next.',
      E: 'Seeing how much closer I am to a bigger goal.',
    },
  },

  Q11: {
    title: 'Your own method',
    question:
      'You are shown a standard method for completing a task, but you think you could approach it differently. What would you do?',
    options: {
      A: 'Use my own approach if I believe it will work.',
      B: 'Use the shared method if it gives everyone a fair and consistent way to work.',
      C: 'Compare both methods and see which has stronger evidence behind it.',
      D: 'Experiment with my own version and see what happens.',
      E: 'Choose the method that best meets the task requirements.',
    },
  },

  Q12: {
    title: 'Plans up in the air',
    question:
      'An unexpected invitation could take you in a completely different direction from the one you planned. What excites you most?',
    options: {
      A: 'Getting the chance to do something unfamiliar.',
      B: 'Sharing an experience with someone important to me.',
      C: 'Discovering something I would not otherwise have encountered.',
      D: 'Exploring all the new possibilities it could inspire.',
      E: 'The chance to accomplish something meaningful.',
    },
  },

  Q13: {
    title: 'Back to the drawing board',
    question:
      'After spending ages on an idea, you discover that it does not work as intended. What is your first response?',
    options: {
      A: 'Have another go rather than give up on it.',
      B: 'Talk it through with someone whose support I value.',
      C: 'Trace the problem back to its cause.',
      D: 'Try a different approach that I have not explored yet.',
      E: 'Identify what I can learn and apply to my next attempt.',
    },
  },

  Q14: {
    title: 'The tough call',
    question:
      'You have to choose between two options, and neither is perfect. What would guide you most?',
    options: {
      A: 'Having the courage to make a choice and stand behind it.',
      B: 'Being considerate of the people who will be affected.',
      C: 'Understanding all the important details before deciding.',
      D: 'Choosing the option that best reflects who I am.',
      E: 'Sticking to the values I believe are right.',
    },
  },

  Q15: {
    title: 'Race day',
    question:
      'You are preparing for a competition where everyone has something different to bring. What motivates you most?',
    options: {
      A: 'Testing myself against a demanding challenge.',
      B: 'Making the people supporting me proud.',
      C: 'Learning from the experience, whatever the result.',
      D: 'Creating a performance or result that stands out.',
      E: 'Giving myself the best possible chance of winning.',
    },
  },

  Q16: {
    title: 'A sudden change',
    question:
      'Halfway through a project, an important requirement changes without warning. What is your likely response?',
    options: {
      A: 'Adjust quickly and keep the work moving.',
      B: 'Check in with everyone to see how the change affects them.',
      C: 'Work out precisely what has changed and why.',
      D: 'Look for opportunities the new situation might create.',
      E: 'Rework the plan so the final goal remains achievable.',
    },
  },

  Q17: {
    title: 'Leading the team',
    question:
      'You are asked to coordinate a group whose members all have different ideas. What would you focus on?',
    options: {
      A: 'Being prepared to make a difficult call when one is needed.',
      B: 'Making sure people feel heard and supported.',
      C: 'Using sound information to guide the group’s decisions.',
      D: 'Encouraging people to contribute original ideas.',
      E: 'Keeping everyone working towards the shared objective.',
    },
  },

  Q18: {
    title: 'A surprising claim',
    question:
      'Someone presents an explanation that sounds completely different from anything you have heard before. What do you do?',
    options: {
      A: 'Challenge them to explain and defend their claim.',
      B: 'Consider whether their perspective reveals something I have missed.',
      C: 'Ask what evidence supports their explanation.',
      D: 'Think about what experiences might have led them to that view.',
      E: 'Build my own explanation from the evidence and explore how the different ideas connect.',
    },
  },

  Q19: {
    title: 'Uncharted territory',
    question:
      'You get the chance to explore a place or subject that is almost entirely unfamiliar to you. What draws you in?',
    options: {
      A: 'The excitement of stepping into the unknown.',
      B: 'The chance to share the experience with others.',
      C: 'Understanding how the place or subject works.',
      D: 'Finding unusual details and imagining what they might mean.',
      E: 'The possibility of making a valuable discovery.',
    },
  },

  Q20: {
    title: 'What stays with you',
    question:
      'Looking back on a major experience, which part are you most likely to remember as important?',
    options: {
      A: 'The moment I chose to be brave and take part.',
      B: 'The people who were there and what we shared.',
      C: 'The understanding I gained and the new ideas it inspired.',
      D: 'The ideas, inspiration and memories it sparked.',
      E: 'The progress I made towards something I wanted to achieve.',
    },
  },

}); 
 
 // ========================================================================
 // 3B. V4.0 PRODUCTION SCORING MATRIX
 // ========================================================================
 
 const V3_2_SCORING_MATRIX = Object.freeze({
 
   Q1: {
     A: { Courage: 0.14, Loyalty: 0.0, Curiosity: 0.0, Independence: 0.12, Ambition: 0.03, Imagination: 0.02, Spontaneity: 0.14, Principles: 0.06 },
     B: { Courage: 0.02, Loyalty: 0.03, Curiosity: 0.05, Independence: 0.04, Ambition: 0.02, Imagination: 0.03, Spontaneity: -0.02, Principles: 0.14 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.03, Imagination: 0.04, Spontaneity: -0.04, Principles: 0.08 },
     D: { Courage: 0.0, Loyalty: 0.14, Curiosity: 0.02, Independence: -0.02, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.06 },
     E: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.05, Independence: 0.04, Ambition: 0.05, Imagination: 0.04, Spontaneity: -0.02, Principles: 0.12 },
   },
 
   Q2: {
     A: { Courage: 0.15, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.12, Ambition: 0.03, Imagination: 0.02, Spontaneity: 0.14, Principles: 0.0 },
     B: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.05, Ambition: 0.04, Imagination: 0.03, Spontaneity: 0.0, Principles: 0.08 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.02, Imagination: 0.05, Spontaneity: -0.05, Principles: 0.04 },
     D: { Courage: 0.02, Loyalty: 0.16, Curiosity: 0.02, Independence: -0.02, Ambition: 0.0, Imagination: 0.01, Spontaneity: 0.02, Principles: 0.03 },
     E: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.03, Ambition: 0.1, Imagination: 0.02, Spontaneity: -0.05, Principles: 0.1 },
   },
 
   Q3: {
     A: { Courage: 0.14, Loyalty: 0.02, Curiosity: 0.0, Independence: 0.12, Ambition: 0.04, Imagination: 0.0, Spontaneity: 0.03, Principles: 0.12 },
     B: { Courage: 0.02, Loyalty: 0.06, Curiosity: 0.11, Independence: 0.02, Ambition: 0.0, Imagination: 0.03, Spontaneity: 0.0, Principles: 0.08 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.14, Independence: 0.04, Ambition: 0.03, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.1 },
     D: { Courage: 0.0, Loyalty: 0.1, Curiosity: 0.04, Independence: 0.0, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.12 },
     E: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.06, Independence: 0.05, Ambition: 0.0, Imagination: 0.03, Spontaneity: -0.02, Principles: 0.14 },
   },
 
   Q4: {
     A: { Courage: 0.14, Loyalty: 0.15, Curiosity: 0.02, Independence: 0.02, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.04, Principles: 0.08 },
     B: { Courage: 0.02, Loyalty: 0.16, Curiosity: 0.0, Independence: 0.0, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.04 },
     C: { Courage: 0.0, Loyalty: 0.05, Curiosity: 0.06, Independence: 0.04, Ambition: 0.06, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.1 },
     D: { Courage: 0.03, Loyalty: 0.16, Curiosity: 0.0, Independence: -0.02, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.06 },
     E: { Courage: 0.02, Loyalty: 0.08, Curiosity: 0.05, Independence: 0.04, Ambition: 0.03, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.15 },
   },
 
   Q5: {
     A: { Courage: 0.15, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.12, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.04, Principles: 0.16 },
     B: { Courage: 0.04, Loyalty: 0.04, Curiosity: 0.03, Independence: 0.02, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.15 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.15, Independence: 0.04, Ambition: 0.02, Imagination: 0.03, Spontaneity: -0.03, Principles: 0.08 },
     D: { Courage: 0.03, Loyalty: 0.12, Curiosity: 0.0, Independence: 0.0, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.16 },
     E: { Courage: 0.04, Loyalty: 0.02, Curiosity: 0.05, Independence: 0.05, Ambition: 0.06, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.15 },
   },
 
   Q6: {
     A: { Courage: 0.12, Loyalty: 0.03, Curiosity: 0.04, Independence: 0.05, Ambition: 0.02, Imagination: 0.03, Spontaneity: 0.16, Principles: 0.0 },
     B: { Courage: 0.0, Loyalty: 0.16, Curiosity: 0.0, Independence: -0.02, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.02, Principles: 0.03 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.05, Ambition: 0.03, Imagination: 0.04, Spontaneity: -0.04, Principles: 0.02 },
     D: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.06, Independence: 0.04, Ambition: 0.03, Imagination: 0.16, Spontaneity: 0.08, Principles: 0.0 },
     E: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.05, Ambition: 0.16, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.06 },
   },
 
   Q7: {
     A: { Courage: 0.16, Loyalty: 0.0, Curiosity: 0.03, Independence: 0.07, Ambition: 0.04, Imagination: 0.02, Spontaneity: 0.14, Principles: 0.0 },
     B: { Courage: 0.08, Loyalty: 0.16, Curiosity: 0.0, Independence: -0.02, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.02, Principles: 0.05 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.03, Imagination: 0.03, Spontaneity: -0.05, Principles: 0.06 },
     D: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.08, Independence: 0.04, Ambition: 0.04, Imagination: 0.02, Spontaneity: -0.04, Principles: 0.14 },
     E: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.04, Ambition: 0.12, Imagination: 0.0, Spontaneity: -0.03, Principles: 0.12 },
   },
 
   Q8: {
     A: { Courage: 0.08, Loyalty: 0.03, Curiosity: 0.0, Independence: 0.04, Ambition: 0.04, Imagination: 0.02, Spontaneity: 0.08, Principles: 0.04 },
     B: { Courage: 0.02, Loyalty: 0.12, Curiosity: 0.0, Independence: 0.0, Ambition: 0.04, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.1 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.15, Independence: 0.06, Ambition: 0.02, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.06 },
     D: { Courage: 0.1, Loyalty: 0.02, Curiosity: 0.03, Independence: 0.05, Ambition: 0.03, Imagination: 0.06, Spontaneity: 0.14, Principles: 0.02 },
     E: { Courage: 0.04, Loyalty: 0.04, Curiosity: 0.02, Independence: 0.03, Ambition: 0.16, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.05 },
   },
 
   Q9: {
     A: { Courage: 0.1, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.05, Ambition: 0.02, Imagination: 0.05, Spontaneity: 0.08, Principles: 0.0 },
     B: { Courage: 0.0, Loyalty: 0.1, Curiosity: 0.08, Independence: 0.0, Ambition: 0.0, Imagination: 0.03, Spontaneity: 0.0, Principles: 0.03 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.05, Ambition: 0.02, Imagination: 0.0, Spontaneity: -0.05, Principles: 0.08 },
     D: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.12, Independence: 0.05, Ambition: 0.0, Imagination: 0.16, Spontaneity: 0.06, Principles: 0.0 },
     E: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.08, Independence: 0.05, Ambition: 0.04, Imagination: 0.06, Spontaneity: 0.03, Principles: 0.02 },
   },
 
   Q10: {
     A: { Courage: 0.06, Loyalty: 0.0, Curiosity: 0.08, Independence: 0.02, Ambition: 0.03, Imagination: 0.02, Spontaneity: 0.02, Principles: 0.0 },
     B: { Courage: 0.0, Loyalty: 0.14, Curiosity: 0.05, Independence: 0.0, Ambition: 0.0, Imagination: 0.03, Spontaneity: 0.0, Principles: 0.03 },
     C: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.15, Independence: 0.05, Ambition: 0.06, Imagination: 0.03, Spontaneity: -0.03, Principles: 0.04 },
     D: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.05, Ambition: 0.1, Imagination: 0.06, Spontaneity: 0.04, Principles: 0.02 },
     E: { Courage: 0.0, Loyalty: 0.06, Curiosity: 0.02, Independence: 0.03, Ambition: 0.16, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.05 },
   },
 
   Q11: {
     A: { Courage: 0.08, Loyalty: 0.0, Curiosity: 0.0, Independence: 0.16, Ambition: 0.04, Imagination: 0.02, Spontaneity: 0.1, Principles: 0.04 },
     B: { Courage: 0.0, Loyalty: 0.1, Curiosity: 0.02, Independence: -0.02, Ambition: 0.0, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.1 },
     C: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.15, Independence: 0.08, Ambition: 0.06, Imagination: 0.04, Spontaneity: -0.02, Principles: 0.08 },
     D: { Courage: 0.05, Loyalty: 0.0, Curiosity: 0.0, Independence: 0.14, Ambition: 0.03, Imagination: 0.02, Spontaneity: 0.1, Principles: 0.02 },
     E: { Courage: 0.0, Loyalty: 0.02, Curiosity: 0.05, Independence: 0.04, Ambition: 0.06, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.12 },
   },
 
   Q12: {
     A: { Courage: 0.1, Loyalty: 0.02, Curiosity: 0.08, Independence: 0.04, Ambition: 0.03, Imagination: 0.04, Spontaneity: 0.14, Principles: 0.0 },
     B: { Courage: 0.02, Loyalty: 0.16, Curiosity: 0.03, Independence: 0.0, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.02 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.03, Imagination: 0.06, Spontaneity: 0.0, Principles: 0.02 },
     D: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.1, Independence: 0.06, Ambition: 0.06, Imagination: 0.16, Spontaneity: 0.1, Principles: 0.0 },
     E: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.03, Ambition: 0.16, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.05 },
   },
 
   Q13: {
     A: { Courage: 0.14, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.06, Ambition: 0.04, Imagination: 0.02, Spontaneity: 0.08, Principles: 0.02 },
     B: { Courage: 0.0, Loyalty: 0.16, Curiosity: 0.02, Independence: 0.0, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.04 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.05, Ambition: 0.06, Imagination: 0.04, Spontaneity: -0.04, Principles: 0.08 },
     D: { Courage: 0.08, Loyalty: 0.0, Curiosity: 0.05, Independence: 0.08, Ambition: 0.0, Imagination: 0.04, Spontaneity: 0.14, Principles: 0.0 },
     E: { Courage: 0.03, Loyalty: 0.0, Curiosity: 0.08, Independence: 0.04, Ambition: 0.1, Imagination: 0.03, Spontaneity: -0.02, Principles: 0.06 },
   },
 
   Q14: {
     A: { Courage: 0.16, Loyalty: 0.0, Curiosity: 0.0, Independence: 0.12, Ambition: 0.02, Imagination: 0.0, Spontaneity: 0.05, Principles: 0.14 },
     B: { Courage: 0.02, Loyalty: 0.16, Curiosity: 0.0, Independence: -0.02, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.08 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.03, Imagination: 0.02, Spontaneity: -0.03, Principles: 0.08 },
     D: { Courage: 0.04, Loyalty: 0.02, Curiosity: 0.0, Independence: 0.16, Ambition: 0.03, Imagination: 0.02, Spontaneity: 0.04, Principles: 0.1 },
     E: { Courage: 0.06, Loyalty: 0.0, Curiosity: 0.0, Independence: 0.04, Ambition: 0.02, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.17 },
   },
 
   Q15: {
     A: { Courage: 0.14, Loyalty: 0.02, Curiosity: 0.04, Independence: 0.04, Ambition: 0.1, Imagination: 0.0, Spontaneity: 0.04, Principles: 0.0 },
     B: { Courage: 0.02, Loyalty: 0.16, Curiosity: 0.03, Independence: 0.0, Ambition: 0.04, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.03 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.03, Ambition: 0.04, Imagination: 0.05, Spontaneity: 0.0, Principles: 0.02 },
     D: { Courage: 0.08, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.06, Ambition: 0.08, Imagination: 0.12, Spontaneity: 0.08, Principles: 0.0 },
     E: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.04, Ambition: 0.17, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.02 },
   },
 
   Q16: {
     A: { Courage: 0.08, Loyalty: 0.02, Curiosity: 0.02, Independence: 0.06, Ambition: 0.0, Imagination: 0.03, Spontaneity: 0.16, Principles: 0.0 },
     B: { Courage: 0.04, Loyalty: 0.08, Curiosity: 0.02, Independence: 0.0, Ambition: 0.02, Imagination: 0.0, Spontaneity: 0.04, Principles: 0.08 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.08, Independence: 0.02, Ambition: 0.06, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.04 },
     D: { Courage: 0.04, Loyalty: 0.02, Curiosity: 0.03, Independence: 0.04, Ambition: 0.08, Imagination: 0.04, Spontaneity: 0.08, Principles: 0.04 },
     E: { Courage: 0.0, Loyalty: 0.03, Curiosity: 0.04, Independence: 0.08, Ambition: 0.06, Imagination: 0.02, Spontaneity: -0.02, Principles: 0.1 },
   },
 
   Q17: {
     A: { Courage: 0.16, Loyalty: 0.04, Curiosity: 0.0, Independence: 0.05, Ambition: 0.08, Imagination: 0.0, Spontaneity: 0.02, Principles: 0.08 },
     B: { Courage: 0.02, Loyalty: 0.16, Curiosity: 0.0, Independence: -0.02, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.0, Principles: 0.04 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.05, Imagination: 0.0, Spontaneity: -0.03, Principles: 0.1 },
     D: { Courage: 0.02, Loyalty: 0.05, Curiosity: 0.08, Independence: 0.04, Ambition: 0.03, Imagination: 0.16, Spontaneity: 0.04, Principles: 0.02 },
     E: { Courage: 0.04, Loyalty: 0.02, Curiosity: 0.0, Independence: 0.03, Ambition: 0.16, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.06 },
   },
 
   Q18: {
     A: { Courage: 0.08, Loyalty: 0.0, Curiosity: 0.03, Independence: 0.06, Ambition: 0.03, Imagination: 0.0, Spontaneity: 0.05, Principles: 0.04 },
     B: { Courage: 0.02, Loyalty: 0.1, Curiosity: 0.12, Independence: 0.0, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.0, Principles: 0.04 },
     C: { Courage: 0.0, Loyalty: 0.0, Curiosity: 0.16, Independence: 0.04, Ambition: 0.02, Imagination: 0.0, Spontaneity: -0.03, Principles: 0.08 },
     D: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.1, Independence: 0.03, Ambition: 0.02, Imagination: 0.08, Spontaneity: 0.04, Principles: 0.06 },
     E: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.14, Independence: 0.16, Ambition: 0.02, Imagination: 0.08, Spontaneity: 0.04, Principles: 0.02 },
   },
 
   Q19: {
     A: { Courage: 0.12, Loyalty: 0.0, Curiosity: 0.08, Independence: 0.04, Ambition: 0.02, Imagination: 0.02, Spontaneity: 0.16, Principles: 0.0 },
     B: { Courage: 0.0, Loyalty: 0.14, Curiosity: 0.02, Independence: 0.0, Ambition: 0.0, Imagination: 0.0, Spontaneity: 0.02, Principles: 0.05 },
     C: { Courage: 0.02, Loyalty: 0.03, Curiosity: 0.16, Independence: 0.04, Ambition: 0.02, Imagination: 0.03, Spontaneity: 0.0, Principles: 0.06 },
     D: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.14, Independence: 0.08, Ambition: 0.03, Imagination: 0.1, Spontaneity: 0.05, Principles: 0.02 },
     E: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.06, Ambition: 0.12, Imagination: 0.04, Spontaneity: 0.0, Principles: 0.03 },
   },
 
   Q20: {
     A: { Courage: 0.14, Loyalty: 0.0, Curiosity: 0.04, Independence: 0.06, Ambition: 0.02, Imagination: 0.02, Spontaneity: 0.06, Principles: 0.04 },
     B: { Courage: 0.0, Loyalty: 0.16, Curiosity: 0.0, Independence: -0.02, Ambition: 0.0, Imagination: 0.02, Spontaneity: 0.02, Principles: 0.03 },
     C: { Courage: 0.02, Loyalty: 0.0, Curiosity: 0.15, Independence: 0.04, Ambition: 0.04, Imagination: 0.1, Spontaneity: 0.0, Principles: 0.05 },
     D: { Courage: 0.02, Loyalty: 0.02, Curiosity: 0.06, Independence: 0.04, Ambition: 0.02, Imagination: 0.16, Spontaneity: 0.1, Principles: 0.02 },
     E: { Courage: 0.04, Loyalty: 0.0, Curiosity: 0.02, Independence: 0.04, Ambition: 0.16, Imagination: 0.0, Spontaneity: -0.02, Principles: 0.06 },
   },
 });
 
 
 // ========================================================================
 // 4. FROZEN 24-CHARACTER DATABASE
 // ========================================================================
 
 const CHARACTER_PROFILES = Object.freeze({
 
   'Harry Potter': [
     10.0, 10.0, 7.0, 9.0, 5.0, 6.0, 9.0, 10.0
   ],
 
   'Hermione Granger': [
     8.0, 9.0, 10.0, 7.0, 9.0, 6.0, 3.0, 10.0
   ],
 
   'Ron Weasley': [
     8.0, 10.0, 5.0, 5.0, 4.0, 8.0, 9.0, 8.0
   ],
 
   'Draco Malfoy': [
     4.0, 5.0, 6.0, 5.0, 9.0, 5.0, 5.0, 3.0
   ],
 
   'Neville Longbottom': [
     10.0, 9.0, 6.0, 7.0, 3.0, 6.0, 4.0, 10.0
   ],
 
   'Ginny Weasley': [
     9.0, 9.0, 7.0, 9.0, 7.0, 6.0, 9.0, 9.0
   ],
 
   'Luna Lovegood': [
     8.0, 9.0, 10.0, 10.0, 2.0, 10.0, 7.0, 9.0
   ],
 
   'Cedric Diggory': [
     9.0, 9.0, 5.0, 7.0, 7.0, 5.0, 5.0, 10.0
   ],
 
   'Fred Weasley': [
     8.0, 9.0, 8.0, 10.0, 8.0, 10.0, 10.0, 6.0
   ],
 
   'George Weasley': [
     8.0, 9.0, 8.0, 10.0, 7.0, 10.0, 9.0, 7.0
   ],
 
   'Albus Dumbledore': [
     9.0, 8.0, 10.0, 10.0, 7.0, 10.0, 5.0, 9.0
   ],
 
   'Severus Snape': [
     9.0, 10.0, 9.0, 9.0, 7.0, 8.0, 2.0, 9.0
   ],
 
   'Minerva McGonagall': [
     9.0, 9.0, 7.0, 8.0, 6.0, 5.0, 3.0, 10.0
   ],
 
   'Remus Lupin': [
     7.0, 9.0, 8.0, 6.0, 4.0, 7.0, 4.0, 10.0
   ],
 
   'Alastor Moody': [
     10.0, 9.0, 8.0, 9.0, 5.0, 5.0, 6.0, 10.0
   ],
 
   'Rubeus Hagrid': [
     9.0, 10.0, 9.0, 7.0, 3.0, 10.0, 8.0, 9.0
   ],
 
   'Sirius Black': [
     10.0, 10.0, 7.0, 10.0, 6.0, 8.0, 10.0, 8.0
   ],
 
   'Lily Potter': [
     10.0, 10.0, 8.0, 9.0, 5.0, 8.0, 6.0, 10.0
   ],
 
   'James Potter': [
     9.0, 9.0, 6.0, 9.0, 8.0, 8.0, 10.0, 7.0
   ],
 
   'Nymphadora Tonks': [
     9.0, 9.0, 7.0, 8.0, 5.0, 9.0, 10.0, 8.0
   ],
 
   'Molly Weasley': [
     9.0, 10.0, 5.0, 7.0, 5.0, 6.0, 6.0, 10.0
   ],
 
   'Arthur Weasley': [
     7.0, 10.0, 10.0, 7.0, 3.0, 10.0, 7.0, 9.0
   ],
 
   'Dobby': [
     10.0, 10.0, 8.0, 9.0, 4.0, 9.0, 10.0, 10.0
   ],
 
   'Newt Scamander': [
     7.0, 9.0, 10.0, 9.0, 2.0, 10.0, 4.0, 10.0
   ],
 });
 
 
 // ========================================================================
 // 5. ERRORS
 // ========================================================================
 
 class QuizValidationError extends Error {
   constructor(message) {
     super(message);
     this.name = 'QuizValidationError';
   }
 }
 
 
 // ========================================================================
 // 6. GENERAL UTILITIES
 // ========================================================================
 
 function isPlainObject(value) {
   return (
     value !== null &&
     typeof value === 'object' &&
     !Array.isArray(value)
   );
 }
 
 function sortedQuestionIds() {
   return Object.keys(QUESTIONS).sort(
     (a, b) =>
       Number(a.slice(1)) -
       Number(b.slice(1))
   );
 }
 
 function deterministicNameCompare(a, b) {
   if (a < b) {
     return -1;
   }
 
   if (a > b) {
     return 1;
   }
 
   return 0;
 }
 
 function calculateMean(vector) {
   return (
     vector.reduce(
       (sum, value) =>
         sum + value,
       0
     ) /
     vector.length
   );
 }
 
 function calculateVariance(vector, mean) {
   return (
     vector.reduce(
       (sum, value) =>
         sum +
         Math.pow(
           value - mean,
           2
         ),
       0
     ) /
     vector.length
   );
 }
 
 
 // ========================================================================
 // 7. QUESTION-SPACE CALIBRATION
 // ========================================================================
 
 function calculateQuestionMeans() {
   const means = {};
 
   for (const questionId of sortedQuestionIds()) {
     means[questionId] = {};
 
     for (const trait of TRAITS) {
       const values = [];
 
       for (const answerId of ANSWER_IDS) {
         values.push(
           V3_2_SCORING_MATRIX[
             questionId
           ][answerId][trait]
         );
       }
 
       means[questionId][trait] =
         calculateMean(values);
     }
   }
 
   return means;
 }
 
 function calculateQuestionStandardDeviations(
   questionMeans
 ) {
   const standardDeviations = {};
 
   for (const questionId of sortedQuestionIds()) {
     standardDeviations[questionId] = {};
 
     for (const trait of TRAITS) {
       const values = [];
 
       for (const answerId of ANSWER_IDS) {
         values.push(
           V3_2_SCORING_MATRIX[
             questionId
           ][answerId][trait]
         );
       }
 
       const mean =
         questionMeans[
           questionId
         ][trait];
 
       const variance =
         calculateVariance(
           values,
           mean
         );
 
       standardDeviations[
         questionId
       ][trait] =
         variance > 0
           ? Math.sqrt(variance)
           : 0.0;
     }
   }
 
   return standardDeviations;
 }
 
 const QUESTION_MEANS =
   Object.freeze(
     calculateQuestionMeans()
   );
 
 const QUESTION_STANDARD_DEVIATIONS =
   Object.freeze(
     calculateQuestionStandardDeviations(
       QUESTION_MEANS
     )
   );
 
 function calibrateAnswer(
   questionId,
   answerId
 ) {
   const calibrated = {};
 
   for (const trait of TRAITS) {
     const value =
       V3_2_SCORING_MATRIX[
         questionId
       ][answerId][trait];
 
     const mean =
       QUESTION_MEANS[
         questionId
       ][trait];
 
     const standardDeviation =
       QUESTION_STANDARD_DEVIATIONS[
         questionId
       ][trait];
 
     if (standardDeviation === 0.0) {
       calibrated[trait] = 0.0;
     } else {
       calibrated[trait] =
         (value - mean) /
         standardDeviation;
     }
   }
 
   return calibrated;
 }
 
 
 // ========================================================================
 // 8. CHARACTER-PROFILE CALIBRATION
 // ========================================================================
 
 function calculateProfileMeans() {
   const means = {};
 
   for (
     let traitIndex = 0;
     traitIndex < TRAITS.length;
     traitIndex++
   ) {
     const trait =
       TRAITS[traitIndex];
 
     means[trait] =
       calculateMean(
         Object.values(
           CHARACTER_PROFILES
         ).map(
           (profile) =>
             profile[traitIndex]
         )
       );
   }
 
   return means;
 }
 
 function calculateProfileStandardDeviations(
   profileMeans
 ) {
   const standardDeviations = {};
 
   for (
     let traitIndex = 0;
     traitIndex < TRAITS.length;
     traitIndex++
   ) {
     const trait =
       TRAITS[traitIndex];
 
     const values =
       Object.values(
         CHARACTER_PROFILES
       ).map(
         (profile) =>
           profile[traitIndex]
       );
 
     const variance =
       calculateVariance(
         values,
         profileMeans[trait]
       );
 
     standardDeviations[trait] =
       variance > 0
         ? Math.sqrt(variance)
         : 1.0;
   }
 
   return standardDeviations;
 }
 
 const PROFILE_MEANS =
   Object.freeze(
     calculateProfileMeans()
   );
 
 const PROFILE_STANDARD_DEVIATIONS =
   Object.freeze(
     calculateProfileStandardDeviations(
       PROFILE_MEANS
     )
   );
 
 function buildCalibratedCharacterProfiles() {
   const calibratedProfiles = {};
 
   for (
     const [
       name,
       profile,
     ] of Object.entries(
       CHARACTER_PROFILES
     )
   ) {
     calibratedProfiles[name] =
       TRAITS.map(
         (trait, index) => {
           const standardDeviation =
             PROFILE_STANDARD_DEVIATIONS[
               trait
             ];
 
           if (
             standardDeviation ===
             0.0
           ) {
             return 0.0;
           }
 
           return (
             (profile[index] -
               PROFILE_MEANS[
                 trait
               ]) /
             standardDeviation
           );
         }
       );
   }
 
   return calibratedProfiles;
 }
 
 const CALIBRATED_CHARACTER_PROFILES =
   Object.freeze(
     buildCalibratedCharacterProfiles()
   );
 
 
 // ========================================================================
 // 9. INPUT VALIDATION
 // ========================================================================
 
 function validateUserResponses(
   userResponses
 ) {
   if (
     !isPlainObject(
       userResponses
     )
   ) {
     throw new QuizValidationError(
       'User responses must be an object.'
     );
   }
 
   const responseKeys =
     Object.keys(
       userResponses
     );
 
   if (
     responseKeys.length !==
     EXPECTED_QUESTION_COUNT
   ) {
     throw new QuizValidationError(
       `Core execution engine requires exactly 20 answers. Found: ${responseKeys.length}`
     );
   }
 
   for (
     const questionId of QUESTION_IDS
   ) {
     if (
       !Object.prototype.hasOwnProperty.call(
         userResponses,
         questionId
       )
     ) {
       throw new QuizValidationError(
         'Exactly Q1-Q20 must be provided.'
       );
     }
   }
 
   for (
     const questionId of responseKeys
   ) {
     if (
       !QUESTION_IDS.has(
         questionId
       )
     ) {
       throw new QuizValidationError(
         `Invalid question handle: ${questionId}`
       );
     }
 
     const choice =
       userResponses[
         questionId
       ];
 
     if (
       !ANSWER_IDS.has(
         choice
       )
     ) {
       throw new QuizValidationError(
         `Invalid answer choice '${choice}' for ${questionId}`
       );
     }
   }
 
   return true;
 }
 
 
 // ========================================================================
 // 10. PRODUCTION MATCHING ENGINE
 // ========================================================================
 
 function processQuizResults(
  userResponses
) {
  validateUserResponses(
    userResponses
  );

  // ------------------------------------------------------------
  // Step 1:
  // Build calibrated question-space vector.
  // ------------------------------------------------------------

  const calibratedTotals =
    Object.fromEntries(
      TRAITS.map(
        (trait) => [
          trait,
          0.0,
        ]
      )
    );

  for (
    const questionId of QUESTION_IDS
  ) {
    const choice =
      userResponses[
        questionId
      ];

    const calibratedAnswer =
      calibrateAnswer(
        questionId,
        choice
      );

    for (
      const trait of TRAITS
    ) {
      calibratedTotals[
        trait
      ] +=
        calibratedAnswer[
          trait
        ];
    }
  }

  const questionNormalisation =
    Math.sqrt(
      EXPECTED_QUESTION_COUNT
    );

  // ------------------------------------------------------------
  // Step 2:
  // Apply trait-level scaling.
  // ------------------------------------------------------------

  const userVector =
    TRAITS.map(
      (trait) =>
        (
          calibratedTotals[
            trait
          ] /
          questionNormalisation
        ) *
        SCALING_FACTORS[
          trait
        ]
    );

  // ------------------------------------------------------------
  // Step 3:
  // Mean-centre user vector.
  // ------------------------------------------------------------

  const uMean =
    calculateMean(
      userVector
    );

  const uNorm =
    Math.sqrt(
      userVector.reduce(
        (
          sum,
          value
        ) =>
          sum +
          Math.pow(
            value -
              uMean,
            2
          ),
        0
      )
    );

  const allCharacterResults =
    [];

  // ------------------------------------------------------------
  // Step 4-6:
  // Compare against every calibrated character profile.
  // ------------------------------------------------------------

  for (
    const [
      name,
      profile,
    ] of Object.entries(
      CALIBRATED_CHARACTER_PROFILES
    )
  ) {
    const cMean =
      calculateMean(
        profile
      );

    const cNorm =
      Math.sqrt(
        profile.reduce(
          (
            sum,
            value
          ) =>
            sum +
            Math.pow(
              value -
                cMean,
              2
            ),
          0
        )
      );

    // ----------------------------------------------------------
    // Component A:
    // Mean-centred Pearson shape similarity
    // ----------------------------------------------------------

    let pearsonR;
    let shapeSimilarity;

    if (
      uNorm === 0.0 ||
      cNorm === 0.0
    ) {
      pearsonR = 0.0;

      shapeSimilarity =
        ZERO_VARIANCE_SHAPE_SIMILARITY;
    } else {
      const dotProduct =
        userVector.reduce(
          (
            sum,
            value,
            index
          ) =>
            sum +
            (
              value -
              uMean
            ) *
            (
              profile[
                index
              ] -
              cMean
            ),
          0
        );

      pearsonR =
        dotProduct /
        (
          uNorm *
          cNorm
        );

      pearsonR =
        Math.max(
          -1.0,
          Math.min(
            1.0,
            pearsonR
          )
        );

      shapeSimilarity =
        (
          pearsonR +
          1.0
        ) /
        2.0;
    }

    // ----------------------------------------------------------
    // Component B:
    // Bounded Euclidean proximity
    // ----------------------------------------------------------

    const euclideanDistance =
      Math.sqrt(
        userVector.reduce(
          (
            sum,
            value,
            index
          ) =>
            sum +
            Math.pow(
              value -
                profile[
                  index
                ],
              2
            ),
          0
        )
      );

    const proximitySimilarity =
      1.0 /
      (
        1.0 +
        euclideanDistance
      );

    // ----------------------------------------------------------
    // Component C:
    // RAW PUBLIC SIMILARITY
    //
    // This is the score that the UI should display.
    // It is mathematically bounded between 0 and 1.
    // ----------------------------------------------------------

    const rawHybridScore =
      (
        SHAPE_WEIGHT *
        shapeSimilarity
      ) +
      (
        PROXIMITY_WEIGHT *
        proximitySimilarity
      );

    // ----------------------------------------------------------
    // Component D:
    // CHARACTER-SPACE RANKING CALIBRATION
    //
    // This score exists ONLY to determine the winner.
    // It must never be presented as the user's similarity
    // percentage.
    // ----------------------------------------------------------

    const calibrationOffset =
      CHARACTER_MATCH_OFFSETS[
        name
      ] ?? 0.0;

    const rankingScore =
      rawHybridScore +
      calibrationOffset;

    allCharacterResults.push({
      name,

      // --------------------------------------------------------
      // PUBLIC SCORE
      //
      // This is the actual 90/10 similarity score.
      // Safe to display as a percentage.
      // --------------------------------------------------------

      hybrid_score:
        rawHybridScore,

      // --------------------------------------------------------
      // INTERNAL RANKING SCORE
      //
      // Used only to select the winner.
      // It is NOT the displayed match percentage.
      // --------------------------------------------------------

      ranking_score:
        rankingScore,

      shape_similarity:
        shapeSimilarity,

      proximity_similarity:
        proximitySimilarity,

      raw_distance:
        euclideanDistance,

      raw_hybrid_score:
        rawHybridScore,

      calibration_offset:
        calibrationOffset,
    });
  }

  // ------------------------------------------------------------
  // Step 7:
  // Determine the winner using calibrated ranking score.
  //
  // IMPORTANT:
  // The calibration exists only to correct character-frequency
  // bias. It must NOT alter the public similarity percentages.
  // ------------------------------------------------------------

  const winner =
    [...allCharacterResults].sort(
      (a, b) => {
        if (
          b.ranking_score !==
          a.ranking_score
        ) {
          return (
            b.ranking_score -
            a.ranking_score
          );
        }

        return deterministicNameCompare(
          a.name,
          b.name
        );
      }
    )[0];

  // ------------------------------------------------------------
  // Step 8:
  // Build the ranking using the same calibrated score as winner
  // selection. The displayed hybrid_score remains the unadjusted
  // 0-1 similarity; the ordering reflects ranking_score.
  // ------------------------------------------------------------

  const publicRanking =
    [...allCharacterResults].sort(
      (a, b) => {
        if (
          b.ranking_score !==
          a.ranking_score
        ) {
          return (
            b.ranking_score -
            a.ranking_score
          );
        }

        return deterministicNameCompare(
          a.name,
          b.name
        );
      }
    );

  return {
    winner,

    ranking:
      publicRanking,

    // Public trait scores represent the calibrated internal
    // personality vector used by the matcher.
    traitScores:
      Object.fromEntries(
        TRAITS.map(
          (trait, index) => [
            trait,
            userVector[
              index
            ],
          ]
        )
      ),
  };
}

// ========================================================================
// 11. PRODUCTION INTEGRITY VERIFICATION
// ========================================================================

// ------------------------------------------------------------------------
// Question structure audit
// ------------------------------------------------------------------------

function verifyQuestionStructure() {
  const questionIds =
    Object.keys(
      QUESTIONS
    );

  if (
    questionIds.length !==
    EXPECTED_QUESTION_COUNT
  ) {
    return false;
  }

  for (
    const questionId of QUESTION_IDS
  ) {
    const question =
      QUESTIONS[
        questionId
      ];

    if (
      !isPlainObject(
        question
      )
    ) {
      return false;
    }

    const requiredFields = [
      'title',
      'question',
      'options',
    ];

    const questionKeys =
      Object.keys(
        question
      );

    if (
      questionKeys.length !==
      requiredFields.length
    ) {
      return false;
    }

    if (
      !requiredFields.every(
        (field) =>
          Object.prototype.hasOwnProperty.call(
            question,
            field
          )
      )
    ) {
      return false;
    }

    if (
      typeof question.title !==
        'string' ||
      !question.title.trim()
    ) {
      return false;
    }

    if (
      typeof question.question !==
        'string' ||
      !question.question.trim()
    ) {
      return false;
    }

    if (
      !isPlainObject(
        question.options
      )
    ) {
      return false;
    }

    const optionKeys =
      Object.keys(
        question.options
      );

    if (
      optionKeys.length !==
      EXPECTED_ANSWER_COUNT
    ) {
      return false;
    }

    for (
      const answerId of ANSWER_IDS
    ) {
      if (
        !Object.prototype.hasOwnProperty.call(
          question.options,
          answerId
        )
      ) {
        return false;
      }

      if (
        typeof question.options[
          answerId
        ] !== 'string' ||
        !question.options[
          answerId
        ].trim()
      ) {
        return false;
      }
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Scaling-factor audit
// ------------------------------------------------------------------------

function verifyScalingFactors() {
  const factorKeys =
    Object.keys(
      SCALING_FACTORS
    );

  if (
    factorKeys.length !==
    EXPECTED_TRAIT_COUNT
  ) {
    return false;
  }

  for (
    const trait of TRAITS
  ) {
    const value =
      SCALING_FACTORS[
        trait
      ];

    if (
      typeof value !==
        'number' ||
      !Number.isFinite(
        value
      ) ||
      value <= 0
    ) {
      return false;
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Complete V3.2 scoring matrix audit
// ------------------------------------------------------------------------

function verifyScoringMatrix() {
  const questionIds =
    Object.keys(
      V3_2_SCORING_MATRIX
    );

  if (
    questionIds.length !==
    EXPECTED_QUESTION_COUNT
  ) {
    return false;
  }

  const observedCoordinates =
    new Set();

  let cellCount = 0;

  for (
    const questionId of questionIds
  ) {
    if (
      !QUESTION_IDS.has(
        questionId
      )
    ) {
      return false;
    }

    const options =
      V3_2_SCORING_MATRIX[
        questionId
      ];

    if (
      !isPlainObject(
        options
      )
    ) {
      return false;
    }

    const optionKeys =
      Object.keys(
        options
      );

    if (
      optionKeys.length !==
      EXPECTED_ANSWER_COUNT
    ) {
      return false;
    }

    for (
      const answerId of ANSWER_IDS
    ) {
      if (
        !Object.prototype.hasOwnProperty.call(
          options,
          answerId
        )
      ) {
        return false;
      }

      const weights =
        options[
          answerId
        ];

      if (
        !isPlainObject(
          weights
        )
      ) {
        return false;
      }

      const weightKeys =
        Object.keys(
          weights
        );

      if (
        weightKeys.length !==
        EXPECTED_TRAIT_COUNT
      ) {
        return false;
      }

      for (
        const trait of TRAITS
      ) {
        if (
          !Object.prototype.hasOwnProperty.call(
            weights,
            trait
          )
        ) {
          return false;
        }

        const value =
          weights[
            trait
          ];

        const coordinate =
          `${questionId}:${answerId}:${trait}`;

        observedCoordinates.add(
          coordinate
        );

        if (
          typeof value !==
            'number' ||
          !Number.isFinite(
            value
          )
        ) {
          return false;
        }

        cellCount += 1;
      }
    }
  }

  if (
    cellCount !==
    EXPECTED_MATRIX_CELL_COUNT
  ) {
    return false;
  }

  if (
    observedCoordinates.size !==
    EXPECTED_MATRIX_CELL_COUNT
  ) {
    return false;
  }

  return true;
}


// ------------------------------------------------------------------------
// Character database audit
// ------------------------------------------------------------------------

function verifyCharacterDatabase() {
  const characterNames =
    Object.keys(
      CHARACTER_PROFILES
    );

  if (
    characterNames.length !==
    EXPECTED_CHARACTER_COUNT
  ) {
    return false;
  }

  for (
    const [
      name,
      profile,
    ] of Object.entries(
      CHARACTER_PROFILES
    )
  ) {
    if (
      typeof name !==
        'string' ||
      !name.trim()
    ) {
      return false;
    }

    if (
      !Array.isArray(
        profile
      ) ||
      profile.length !==
      EXPECTED_TRAIT_COUNT
    ) {
      return false;
    }

    for (
      const value of profile
    ) {
      if (
        typeof value !==
          'number' ||
        !Number.isFinite(
          value
        )
      ) {
        return false;
      }

      if (
        value < 0.0 ||
        value > 10.0
      ) {
        return false;
      }
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Question-calibration audit
// ------------------------------------------------------------------------

function verifyQuestionCalibration() {
  for (
    const questionId of QUESTION_IDS
  ) {
    for (
      const trait of TRAITS
    ) {
      const mean =
        QUESTION_MEANS[
          questionId
        ][trait];

      const standardDeviation =
        QUESTION_STANDARD_DEVIATIONS[
          questionId
        ][trait];

      if (
        !Number.isFinite(
          mean
        ) ||
        !Number.isFinite(
          standardDeviation
        ) ||
        standardDeviation < 0
      ) {
        return false;
      }

      for (
        const answerId of ANSWER_IDS
      ) {
        const calibrated =
          calibrateAnswer(
            questionId,
            answerId
          )[trait];

        if (
          !Number.isFinite(
            calibrated
          )
        ) {
          return false;
        }
      }
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Character-calibration audit
// ------------------------------------------------------------------------

function verifyCharacterCalibration() {
  if (
    Object.keys(
      CALIBRATED_CHARACTER_PROFILES
    ).length !==
    EXPECTED_CHARACTER_COUNT
  ) {
    return false;
  }

  for (
    const profile of Object.values(
      CALIBRATED_CHARACTER_PROFILES
    )
  ) {
    if (
      !Array.isArray(
        profile
      ) ||
      profile.length !==
      EXPECTED_TRAIT_COUNT
    ) {
      return false;
    }

    for (
      const value of profile
    ) {
      if (
        !Number.isFinite(
          value
        )
      ) {
        return false;
      }
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Character-match calibration audit
// ------------------------------------------------------------------------

function verifyCharacterMatchCalibration() {
  const characterNames =
    Object.keys(
      CHARACTER_PROFILES
    );

  if (
    Object.keys(
      CHARACTER_MATCH_OFFSETS
    ).length !==
    EXPECTED_CHARACTER_COUNT
  ) {
    return false;
  }

  for (
    const name of characterNames
  ) {
    const offset =
      CHARACTER_MATCH_OFFSETS[
        name
      ];

    if (
      typeof offset !==
        'number' ||
      !Number.isFinite(
        offset
      )
    ) {
      return false;
    }
  }

  for (
    const name of Object.keys(
      CHARACTER_MATCH_OFFSETS
    )
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        CHARACTER_PROFILES,
        name
      )
    ) {
      return false;
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Zero-variance safety audit
// ------------------------------------------------------------------------

function verifyZeroVarianceSafety() {
  const flatVectors = [
    Array(8).fill(5.0),
    Array(8).fill(0.0),
    Array(8).fill(10.0),
  ];

  for (
    const vector of flatVectors
  ) {
    const mean =
      calculateMean(
        vector
      );

    const variance =
      calculateVariance(
        vector,
        mean
      );

    if (
      variance !== 0.0
    ) {
      return false;
    }

    const norm =
      Math.sqrt(
        variance *
        vector.length
      );

    if (
      norm !== 0.0
    ) {
      return false;
    }
  }

  return true;
}


// ------------------------------------------------------------------------
// Raw-score bounds audit
// ------------------------------------------------------------------------
//
// The PUBLIC hybrid score must always remain inside 0-1.
//
// The ranking score is allowed to move outside 0-1 because it includes
// additive character-space calibration.
//
// ------------------------------------------------------------------------

function verifyScoreBounds() {
  const flatVectors = [
    Array(8).fill(5.0),
    Array(8).fill(0.0),
    Array(8).fill(10.0),
  ];

  for (
    const vector of flatVectors
  ) {
    const mean =
      calculateMean(
        vector
      );

    const norm =
      Math.sqrt(
        vector.reduce(
          (
            sum,
            value
          ) =>
            sum +
            Math.pow(
              value -
                mean,
              2
            ),
          0
        )
      );

    const shapeSimilarity =
      norm === 0.0
        ? ZERO_VARIANCE_SHAPE_SIMILARITY
        : 0.5;

    for (
      const [
        name,
        profile,
      ] of Object.entries(
        CALIBRATED_CHARACTER_PROFILES
      )
    ) {
      const distance =
        Math.sqrt(
          vector.reduce(
            (
              sum,
              value,
              index
            ) =>
              sum +
              Math.pow(
                value -
                  profile[
                    index
                  ],
                2
              ),
            0
          )
        );

      const proximitySimilarity =
        1.0 /
        (
          1.0 +
          distance
        );

      const rawScore =
        (
          SHAPE_WEIGHT *
          shapeSimilarity
        ) +
        (
          PROXIMITY_WEIGHT *
          proximitySimilarity
        );

      if (
        !Number.isFinite(
          rawScore
        ) ||
        rawScore < 0.0 ||
        rawScore > 1.0
      ) {
        return false;
      }

      const offset =
        CHARACTER_MATCH_OFFSETS[
          name
        ];

      if (
        !Number.isFinite(
          offset
        )
      ) {
        return false;
      }

      const rankingScore =
        rawScore +
        offset;

      if (
        !Number.isFinite(
          rankingScore
        )
      ) {
        return false;
      }
    }
  }

  return true;
}


// ========================================================================
// 12. MATCHING-ENGINE SMOKE TEST
// ========================================================================

function verifyMatchingEngine() {
  const validResponses =
    Object.fromEntries(
      Array.from(
        QUESTION_IDS,
        (questionId) => [
          questionId,
          'A',
        ]
      )
    );

  let result;

  try {
    result =
      processQuizResults(
        validResponses
      );
  } catch {
    return false;
  }

  if (
    !result ||
    !result.winner ||
    !Array.isArray(
      result.ranking
    )
  ) {
    return false;
  }

  if (
    result.ranking.length !==
    EXPECTED_CHARACTER_COUNT
  ) {
    return false;
  }

  if (
    result.winner.name !==
    result.ranking[0].name
  ) {
    return false;
  }

  for (
    const character of result.ranking
  ) {
    if (
      typeof character.name !==
        'string' ||
      !Number.isFinite(
        character.hybrid_score
      ) ||
      !Number.isFinite(
        character.ranking_score
      ) ||
      !Number.isFinite(
        character.shape_similarity
      ) ||
      !Number.isFinite(
        character.proximity_similarity
      ) ||
      !Number.isFinite(
        character.raw_distance
      ) ||
      !Number.isFinite(
        character.raw_hybrid_score
      ) ||
      !Number.isFinite(
        character.calibration_offset
      )
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // PUBLIC similarity must remain bounded.
    // ----------------------------------------------------------

    if (
      character.hybrid_score < 0.0 ||
      character.hybrid_score > 1.0
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // Explicit raw-score consistency check.
    // ----------------------------------------------------------

    if (
      Math.abs(
        character.hybrid_score -
        character.raw_hybrid_score
      ) > 1e-12
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // Ranking score must equal raw score + calibration.
    // ----------------------------------------------------------

    const expectedRankingScore =
      character.raw_hybrid_score +
      character.calibration_offset;

    if (
      Math.abs(
        character.ranking_score -
        expectedRankingScore
      ) > 1e-12
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // Shape similarity bounds.
    // ----------------------------------------------------------

    if (
      character.shape_similarity < 0.0 ||
      character.shape_similarity > 1.0
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // Proximity similarity bounds.
    // ----------------------------------------------------------

    if (
      character.proximity_similarity < 0.0 ||
      character.proximity_similarity > 1.0
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // Distance cannot be negative.
    // ----------------------------------------------------------

    if (
      character.raw_distance < 0.0
    ) {
      return false;
    }
  }

  // ------------------------------------------------------------
  // Ranking order must actually be descending.
  // ------------------------------------------------------------

  for (
    let index = 1;
    index <
      result.ranking.length;
    index++
  ) {
    const previous =
      result.ranking[
        index - 1
      ];

    const current =
      result.ranking[
        index
      ];

    if (
      previous.ranking_score <
      current.ranking_score
    ) {
      return false;
    }

    if (
      previous.ranking_score ===
        current.ranking_score &&
      deterministicNameCompare(
        previous.name,
        current.name
      ) > 0
    ) {
      return false;
    }
  }

  return true;
}


// ========================================================================
// 13. INVALID-INPUT AUDIT
// ========================================================================

function verifyInputValidation() {
  const validResponses =
    Object.fromEntries(
      Array.from(
        QUESTION_IDS,
        (questionId) => [
          questionId,
          'A',
        ]
      )
    );

  // Valid input must pass.
  try {
    processQuizResults(
      validResponses
    );
  } catch {
    return false;
  }

  // Missing question must fail.
  const missingQuestion = {
    ...validResponses,
  };

  delete missingQuestion.Q20;

  try {
    processQuizResults(
      missingQuestion
    );

    return false;
  } catch (error) {
    if (
      !(
        error instanceof
        QuizValidationError
      )
    ) {
      return false;
    }
  }

  // Invalid answer must fail.
  const invalidAnswer = {
    ...validResponses,
    Q1: 'Z',
  };

  try {
    processQuizResults(
      invalidAnswer
    );

    return false;
  } catch (error) {
    if (
      !(
        error instanceof
        QuizValidationError
      )
    ) {
      return false;
    }
  }

  // Extra question must fail.
  const extraQuestion = {
    ...validResponses,
    Q21: 'A',
  };

  try {
    processQuizResults(
      extraQuestion
    );

    return false;
  } catch (error) {
    if (
      !(
        error instanceof
        QuizValidationError
      )
    ) {
      return false;
    }
  }

  return true;
}


// ========================================================================
// 14. MASTER PRODUCTION INTEGRITY CHECK
// ========================================================================

function verifyProductionPackageIntegrity() {
  try {
    return (
      verifyQuestionStructure() &&
      verifyScalingFactors() &&
      verifyScoringMatrix() &&
      verifyCharacterDatabase() &&
      verifyQuestionCalibration() &&
      verifyCharacterCalibration() &&
      verifyCharacterMatchCalibration() &&
      verifyZeroVarianceSafety() &&
      verifyScoreBounds() &&
      verifyMatchingEngine() &&
      verifyInputValidation()
    );
  } catch {
    return false;
  }
}

// ========================================================================
// 16. EXPORTS
// ========================================================================

export {
  TRAITS,
  SCALING_FACTORS,
  QUESTIONS,

  // Kept under the original name so existing React imports do not break.
  V3_2_SCORING_MATRIX,

  CHARACTER_PROFILES,

  // Character-space ranking calibration data.
  CHARACTER_MATCH_OFFSETS,

  // Question/profile calibration data.
  QUESTION_MEANS,
  QUESTION_STANDARD_DEVIATIONS,
  PROFILE_MEANS,
  PROFILE_STANDARD_DEVIATIONS,
  CALIBRATED_CHARACTER_PROFILES,

  processQuizResults,

  verifyProductionPackageIntegrity,
  verifyQuestionStructure,
  verifyScalingFactors,
  verifyScoringMatrix,
  verifyCharacterDatabase,
  verifyQuestionCalibration,
  verifyCharacterCalibration,
  verifyCharacterMatchCalibration,
  verifyZeroVarianceSafety,
  verifyScoreBounds,
  verifyMatchingEngine,
  verifyInputValidation,
};


// ========================================================================
// 17. OPTIONAL DEVELOPMENT SELF-CHECK
// ========================================================================
//
// This does NOT start a server.
//
// It only performs the integrity check when this module is executed
// directly in a Node environment.
//
// In Vite/React, the module is imported normally and this block is skipped.
// ========================================================================

if (
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  import.meta.url ===
    `file://${process.argv[1]}`
) {
  console.log(
    '='.repeat(72)
  );

  console.log(
    'V4.0 PERSONALITY QUIZ ENGINE'
  );

  console.log(
    '='.repeat(72)
  );

  const integrityPassed =
    verifyProductionPackageIntegrity();

  if (
    !integrityPassed
  ) {
    console.error(
      '❌ CRITICAL REJECTION: ' +
      'STRUCTURAL INTEGRITY BREAK DETECTED.'
    );

    process.exit(1);
  }

  console.log(
    '🟢 V4.0 INTEGRITY CHECK: ALL CHECKS PASSED.'
  );

  console.log(
    `   Questions  : ${
      Object.keys(
        QUESTIONS
      ).length
    }`
  );

  console.log(
    `   Answers    : ${
      Object.keys(
        QUESTIONS
      ).length *
      EXPECTED_ANSWER_COUNT
    }`
  );

  console.log(
    `   Traits     : ${
      TRAITS.length
    }`
  );

  console.log(
    `   Characters : ${
      Object.keys(
        CHARACTER_PROFILES
      ).length
    }`
  );

  console.log(
    `   Cells      : ${
      EXPECTED_MATRIX_CELL_COUNT
    }`
  );

  console.log(
    '   Calibration: Question-space + profile-space + character-space ranking'
  );

  console.log(
    '   Matching   : 90% shape + 10% proximity'
  );

  console.log(
    '   Public %   : Raw bounded hybrid similarity'
  );

  console.log(
    '   Ranking    : Calibrated hybrid score'
  );

  console.log(
    '   Questions  : Q1-Q20 only'
  );

  console.log(
    '='.repeat(72)
  );
}
