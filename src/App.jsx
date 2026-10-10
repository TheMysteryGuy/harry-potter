
import { useState } from "react";
import "./App.css";
import { useEffect } from "react";

import {
  getQuestions,
  getQuizResults,
  getCharacterProfile,
} from "./api.js";

// ============================================================
// CONSTANTS
// ============================================================

const ANSWER_IDS = ["A", "B", "C", "D", "E"];
const TRAITS = [
  "Courage",
  "Loyalty",
  "Curiosity",
  "Independence",
  "Ambition",
  "Imagination",
  "Spontaneity",
  "Principles",
];

// ============================================================
// CHARACTER MESSAGES
// ============================================================

const CHARACTER_MESSAGES = Object.freeze({
  "Harry Potter": {
    primary:
      "You’re the sort of person who finds it difficult to stand by when something feels wrong. You might not always have a plan, and you certainly don’t need to have every answer before you act, but your instincts and your loyalty often guide you in the right direction. You care more about protecting the people who matter to you than about being seen as a hero. When a situation gets difficult, you’re likely to face it rather than leave someone else to deal with it alone.",
    traits: ["Courage", "Loyalty", "Independence", "Principles"],
  },

  "Hermione Granger": {
    primary:
      "You rarely find 'because that's just how it is' a satisfying explanation. If something interests you, you want to understand it properly, and if you believe something can be done better, you’re likely to put in the work to prove it. You take your responsibilities seriously and can become frustrated when other people overlook details you consider important. But your intelligence isn’t just about getting the right answer: you’re also willing to question authority, defend your friends and rethink your position when it matters.",
    traits: ["Curiosity", "Principles", "Ambition", "Loyalty"],
  },

  "Ron Weasley": {
    primary:
      "You bring a very human kind of courage to the people around you. You might have doubts, compare yourself with others or wonder whether you’re quite good enough, but that doesn’t stop you showing up for the people you care about. You’re likely to bring humour and spontaneity to a situation, especially when everyone else is taking things too seriously. You don’t have to be the most confident person in the room to make a difference; sometimes your greatest strength is being the friend who stays.",
    traits: ["Loyalty", "Courage", "Spontaneity", "Principles"],
  },

  "Draco Malfoy": {
    primary:
      "You have a competitive streak, a strong sense of pride and a desire to show people what you’re capable of. Being underestimated—or feeling as though someone else is getting ahead of you—can be difficult to ignore. You like having a sense of control over your own path, and you may care more about other people’s opinions than you let on. Yet there’s more to you than appearances: one of your biggest challenges can be working out which expectations are genuinely yours and which you’ve simply inherited from the people around you.",
    traits: ["Ambition", "Independence", "Courage", "Curiosity"],
  },

  "Neville Longbottom": {
    primary:
      "You might not always recognise your own capabilities straight away, particularly when you’re surrounded by people who seem more confident or outspoken. But give yourself something worth standing up for, and you can discover a determination that surprises even you. You don’t need to dominate a conversation or attract attention to have an impact. Your strength comes from caring deeply, learning from experience and finding the courage to act when it would be easier to stay out of things.",
    traits: ["Courage", "Principles", "Loyalty", "Independence"],
  },

  "Ginny Weasley": {
    primary:
      "You’re comfortable having your own opinions, making your own decisions and getting on with things without waiting for permission. You can be playful and spontaneous, but don’t mistake that for a lack of determination: when something matters to you, you know how to stand your ground. You value the people close to you without needing to make your whole identity about them. You’d rather be recognised for what you can actually do than remain in someone else’s shadow.",
    traits: ["Independence", "Courage", "Spontaneity", "Loyalty"],
  },

  "Luna Lovegood": {
    primary:
      "Your mind doesn’t always follow the route everyone else takes—and that’s part of what makes you interesting. You’re willing to entertain unusual ideas, notice little details other people miss and ask questions that might never occur to anyone else. You don’t see much point in changing yourself just to make everyone comfortable. Even when people don’t immediately understand your perspective, you can remain open-minded and quietly confident in the way you see the world.",
    traits: ["Imagination", "Curiosity", "Independence", "Spontaneity"],
  },

  "Cedric Diggory": {
    primary:
      "You enjoy doing well, but winning isn’t the only thing that matters to you. You want to know that you’ve earned your success and treated people fairly along the way. You can be confident without needing to make everyone else feel smaller, and you’re likely to appreciate people who show the same respect in return. When you take on a challenge, you want to give it your best—and you want the way you handle yourself to mean something, whatever the final result.",
    traits: ["Principles", "Courage", "Loyalty", "Ambition"],
  },

  "Fred Weasley": {
    primary:
      "You’re rarely satisfied with doing things the predictable way when there’s a chance to make them more interesting. You enjoy experimenting, making people laugh and seeing what happens when someone dares to try a different approach. Rules don’t automatically impress you just because they exist, particularly if you think there’s a more exciting possibility. But beneath the mischief is a serious streak: when you believe in something—or someone—you’re prepared to put real effort and courage behind it.",
    traits: ["Spontaneity", "Imagination", "Independence", "Ambition"],
  },

  "George Weasley": {
    primary:
      "You have a knack for finding the entertaining angle that other people have missed. You enjoy bouncing ideas around, making people laugh and turning an ordinary moment into something people remember. You’re independent-minded, but you also understand the value of having someone who gets your sense of humour and can build on your ideas. You may use jokes to keep things light, yet your loyalty runs deeper than the playful side people see first.",
    traits: ["Imagination", "Independence", "Spontaneity", "Loyalty"],
  },

  "Albus Dumbledore": {
    primary:
      "You’re rarely content with looking at a problem from just one angle. You enjoy connecting ideas, considering what might happen next and asking questions that take you beyond the obvious answer. You understand that knowledge is powerful, but you also recognise that knowing something and knowing what to do with it are two different things. You may keep some of your thoughts to yourself until you’ve considered the bigger picture, especially when your decisions could affect other people.",
    traits: ["Curiosity", "Imagination", "Independence", "Principles"],
  },

  "Severus Snape": {
    primary:
      "You tend to keep your thoughts and feelings close rather than explaining yourself to everyone around you. You notice details, form your own judgements and can remain committed to something long after other people have stopped paying attention. People may not always understand your choices, partly because you don’t make a habit of explaining every reason behind them. But when someone or something genuinely matters to you, your commitment can run much deeper than your outward behaviour suggests.",
    traits: ["Loyalty", "Principles", "Independence", "Courage"],
  },

  "Minerva McGonagall": {
    primary:
      "You’re someone who takes your responsibilities seriously and doesn't easily abandon what you believe is right. When things become difficult, you’re more likely to look for a sensible way forward than let the situation overwhelm you. You may not always be the most openly expressive person in the room, but that doesn't mean you care any less. You show it through your actions, your reliability and your willingness to speak up when something matters. Like Minerva, you can combine a firm sense of principle with a genuine commitment to the people around you.",
    traits: ["Principles", "Courage", "Loyalty", "Independence"],
  },

  "Remus Lupin": {
    primary:
      "You tend to look for the reasons behind people’s behaviour before deciding what to think of them. You can listen without immediately judging, consider different sides of a disagreement and offer a perspective that helps people see things more clearly. You value loyalty, but you also understand that people can be complicated and that everyone has things they’re working through. You don’t need to be the loudest voice in a group to make a meaningful contribution; often, your strength lies in how thoughtfully you respond.",
    traits: ["Loyalty", "Curiosity", "Principles", "Imagination"],
  },

  "Alastor Moody": {
    primary:
      "You like knowing what you’re dealing with before you commit to a decision. You’re the person who notices what could go wrong, asks the awkward practical question and would rather prepare early than rely on everything working out by chance. That can make you cautious about trusting a situation at face value, but it also means you take your responsibilities seriously. When something important is at risk, you’re willing to act decisively and do what needs to be done.",
    traits: ["Courage", "Independence", "Principles", "Curiosity"],
  },

  "Rubeus Hagrid": {
    primary:
      "You have a big heart and a genuine enthusiasm for the things—and people—you care about. You’re drawn to what makes the world unusual, interesting or misunderstood, and you’re often willing to give someone a chance when others have already made up their minds. Your loyalty can be wonderfully wholehearted, and you don’t always hide how much something means to you. You might occasionally leap in before thinking through every consequence, but when someone needs your support, you’re ready to show up.",
    traits: ["Loyalty", "Curiosity", "Imagination", "Courage"],
  },

  "Sirius Black": {
    primary:
      "You have a strong need to live according to your own convictions rather than become the person other people expect you to be. You value freedom, speak your mind and can react strongly when you see someone being treated unfairly. You’re not especially inclined to follow a rule simply because it’s traditional, particularly when it conflicts with what you believe is right. But independence doesn’t mean you want to go through life alone: the people you choose as your own can matter to you enormously.",
    traits: ["Independence", "Courage", "Loyalty", "Spontaneity"],
  },

  "Lily Potter": {
    primary:
      "You’re guided by a strong sense of what is right, but you’re not afraid to put that conviction into practice. You can challenge someone you disagree with without losing sight of the person behind the argument, and you care about how your choices affect others. When your values are tested, you’re capable of making a difficult decision rather than choosing the comfortable option. Your courage isn’t about proving that you’re fearless; it’s about knowing what matters enough to stand by it.",
    traits: ["Principles", "Courage", "Loyalty", "Independence"],
  },

  "James Potter": {
    primary:
      "You enjoy a challenge, have plenty of energy and aren’t usually the person who waits quietly on the sidelines. Competition can bring out your confidence, and you like having the chance to test yourself against something difficult. Your spontaneity makes you fun to be around, although your enthusiasm can sometimes get ahead of your judgement. As you grow, one of your biggest strengths is learning how to pair that confidence with the responsibility you owe to the people who trust you.",
    traits: ["Courage", "Spontaneity", "Independence", "Ambition"],
  },

  "Nymphadora Tonks": {
    primary:
      "You’re happiest when you can be yourself instead of trying to fit neatly into somebody else’s idea of how you should behave. You bring energy and humour to the people around you, and you’re often willing to try something different rather than worry about looking perfectly polished. You can adapt when plans change, especially if you can find a way to make the situation your own. But you’re more than the fun-loving side people notice first: when things become serious, you know how to focus and be brave.",
    traits: ["Spontaneity", "Independence", "Imagination", "Courage"],
  },

  "Molly Weasley": {
    primary:
      "When you care about someone, you make sure they know they can count on you. You pay attention to what people need, take responsibility seriously and are willing to be firm when you think someone is making a mistake. You might sometimes worry more than you let on, especially when the people you love are involved, but that concern comes from how deeply you care. Underestimate you at your peril: when something threatens your family or your principles, you can be extraordinarily determined.",
    traits: ["Loyalty", "Principles", "Courage", "Ambition"],
  },

  "Arthur Weasley": {
    primary:
      "You can become genuinely fascinated by something simply because you’ve never encountered it before. You like asking questions, discovering how unfamiliar things work and learning from people whose experiences differ from your own. You don’t need every interest to be practical or impressive to other people; sometimes the joy is in finding out something new. Your curiosity is matched by a warmth that makes it easy to share your enthusiasm, and you’re happy to keep learning even when there’s plenty you still don’t know.",
    traits: ["Curiosity", "Imagination", "Loyalty", "Independence"],
  },

  "Dobby": {
    primary:
      "You know what it means to want the freedom to make your own choices, and you’re determined not to let other people decide your worth for you. You can be incredibly devoted to the people you care about, sometimes going further to help them than they would ever expect. Others might underestimate you, but you have a strong sense of right and wrong and a surprising amount of courage when it counts. You’re at your best when your loyalty comes with the confidence to stand up for yourself, too.",
    traits: ["Loyalty", "Principles", "Courage", "Independence"],
  },

  "Newt Scamander": {
    primary:
      "You’re fascinated by the things other people pass by without a second thought. You prefer to understand something on its own terms rather than judge it by how unusual it seems, and you’re often more interested in genuine discovery than in impressing a crowd. You may take a little time to feel comfortable in unfamiliar social situations, but give you something meaningful to care for or protect and your determination becomes clear. Your quiet curiosity is not a lack of courage; it simply means you don’t need to make a show of it.",
    traits: ["Curiosity", "Imagination", "Independence", "Principles"],
  },
});

// ============================================================
// HELPERS
// ============================================================

const getCharacterProfileData = (characterName) => {
  const profile = getCharacterProfile(characterName);

  if (!Array.isArray(profile) || profile.length !== TRAITS.length) {
    return null;
  }

  return TRAITS.map((trait, index) => ({
    trait,
    score: Number(profile[index]),
  }));
};

// Convert an actual character profile value (0–10)
// into the percentage used by the visual bar.

const getCharacterTraitPercentage = (score) => {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericScore * 10));
};

const formatTraits = (traits) => {
  if (!Array.isArray(traits) || traits.length === 0) {
    return "several of the same qualities";
  }

  const selectedTraits = traits.slice(0, 3);

  if (selectedTraits.length === 1) {
    return selectedTraits[0];
  }

  if (selectedTraits.length === 2) {
    return `${selectedTraits[0]} and ${selectedTraits[1]}`;
  }

  return `${selectedTraits[0]}, ${selectedTraits[1]} and ${selectedTraits[2]}`;
};

// ============================================================
// CALIBRATION LOGGING
// ============================================================

const logCalibrationReport = (report) => {
  console.log("CALIBRATION SETTINGS", report.settings);

  console.log("CALIBRATION SUMMARY", report.calibration.summary);
  console.table(report.calibration.results);

  console.log("INDEPENDENT VALIDATION RESULTS");

  report.validation.forEach((validation) => {
    console.log(`Validation seed: ${validation.seed}`);
    console.log("Summary:", validation.summary);
    console.table(validation.results);
  });

  console.log(
    "BASELINE — ZERO OFFSETS",
    report.baselineComparison.zeroOffsets.summary
  );
  console.table(report.baselineComparison.zeroOffsets.results);

  console.log(
    "BASELINE — PRODUCTION OFFSETS",
    report.baselineComparison.productionOffsets.summary
  );
  console.table(report.baselineComparison.productionOffsets.results);

  console.log(
    "BASELINE — SUGGESTED OFFSETS",
    report.baselineComparison.suggestedOffsets.summary
  );
  console.table(report.baselineComparison.suggestedOffsets.results);

  console.log("SUGGESTED CHARACTER OFFSETS");
  console.table(
    Object.entries(report.offsets).map(([character, offset]) => ({
      character,
      offset,
    }))
  );

  console.log("Calibration note:", report.note);
};

// ============================================================
// APP
// ============================================================

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [questions] = useState(() => {
    try {
      const loadedQuestions = getQuestions();
      return Array.isArray(loadedQuestions) ? loadedQuestions : [];
    } catch {
      return [];
    }
  });

  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calibrating, setCalibrating] = useState(false);

  const totalQuestions = questions.length;

  // ============================================================
  // AUTO-SCROLL WHEN THE QUESTION CHANGES
  // ============================================================

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentQuestion]);

  // ============================================================
  // ANSWER SELECTION
  // ============================================================

  const selectAnswer = (answer) => {
    const question = questions[currentQuestion];

    if (!question || !ANSWER_IDS.includes(answer)) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [question.id]: answer,
    }));

    setError(null);
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const nextQuestion = () => {
    if (
      currentQuestion < totalQuestions - 1 &&
      answers[questions[currentQuestion]?.id]
    ) {
      setCurrentQuestion((previous) => previous + 1);
      setError(null);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
      setError(null);
    }
  };

  // ============================================================
  // SUBMIT QUIZ
  // ============================================================

  const submitQuiz = () => {
    const answeredCount = Object.keys(answers).length;

    if (answeredCount !== totalQuestions) {
      setError(`Please answer all ${totalQuestions} questions.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = getQuizResults(answers);

      if (
        !data ||
        !Array.isArray(data.ranking) ||
        data.ranking.length === 0
      ) {
        throw new Error(
          "The scoring system returned an invalid result."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process your result."
      );
    } finally {
      setLoading(false);
    }
  };

  
  // ============================================================
  // START QUIZ
  // ============================================================

  const startQuiz = () => {
    setHasStarted(true);
    setCurrentQuestion(0);
    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // RESTART
  // ============================================================

  const restartQuiz = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
    setError(null);
    setLoading(false);
    setHasStarted(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // INITIAL ERROR
  // ============================================================

  if (totalQuestions === 0) {
    return (
      <main className="app">
        <div className="error-screen">
          <h1>Something went wrong</h1>

          <p>The quiz questions could not be loaded.</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // RESULTS SCREEN
  // ============================================================

  if (result) {
    
  const ranking = Array.isArray(result.ranking)
    ? [...result.ranking].sort((a, b) => {
      const scoreDifference =
        Number(b.hybrid_score) - Number(a.hybrid_score);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return deterministicNameCompare(a.name, b.name);
      })
    : [];


    const winner = ranking[0];
    const second = ranking[1];
    const third = ranking[2];

    if (!winner) {
      return (
        <main className="app">
          <div className="error-screen">
            <h1>Something went wrong</h1>

            <p>No character match was returned.</p>

            <button type="button" onClick={restartQuiz}>
              Restart quiz
            </button>
          </div>
        </main>
      );
    }

    const winnerMessage = CHARACTER_MESSAGES[winner.name];

    const secondMessage = second
      ? CHARACTER_MESSAGES[second.name]
      : null;

    const thirdMessage = third
      ? CHARACTER_MESSAGES[third.name]
      : null;

    // This is the actual character profile used by the quiz.
    const winnerProfile = getCharacterProfileData(winner.name);

    return (
      <main className="app">
        <section className="results-screen">
          {/* WINNER */}

          <div className="results-header">
            <p className="eyebrow">YOUR CLOSEST MATCH</p>

            <h1>{winner.name}</h1>

            <p className="result-score">
              {(Number(winner.hybrid_score) * 100).toFixed(2)}%
            </p>
          </div>

          {/* WINNER MESSAGE */}

          {winnerMessage && (
            <section className="character-message primary-message">
              <p className="message-label">WHY YOU MATCH</p>

              <p className="message-text">
                {winnerMessage.primary}
              </p>
            </section>
          )}

          {/* MATCH BREAKDOWN */}

          <div className="result-breakdown">
            <div className="result-card">
              <span>Shape similarity</span>

              <strong>
                {(Number(winner.shape_similarity) * 100).toFixed(2)}%
              </strong>
            </div>

            <div className="result-card">
              <span>Proximity</span>

              <strong>
                {Number(winner.proximity_similarity).toFixed(4)}
              </strong>
            </div>
          </div>

          {/* CHARACTER PROFILE */}

          {winnerProfile && (
            <section className="trait-profile">
              <div className="other-matches-heading">
                <p className="eyebrow">YOUR MATCH’S TRAIT PROFILE</p>

                <h2>{winner.name}'s Character Profile</h2>
              </div>

              <div className="trait-list">
                {winnerProfile.map(({ trait, score }) => {
                  const percentage = getCharacterTraitPercentage(score);

                  return (
                    <div className="trait-row" key={trait}>
                      <div className="trait-header">
                        <span>{trait}</span>

                        <strong>{score.toFixed(1)}</strong>
                      </div>

                      <div className="trait-bar" aria-hidden="true">
                        <div
                          className="trait-bar-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* OTHER CLOSE MATCHES */}

          <section className="other-matches">
            <div className="other-matches-heading">
              <p className="eyebrow">OTHER CLOSE MATCHES</p>

              <h2>What they would see in you</h2>
            </div>

            {second && secondMessage && (
              <article className="character-message secondary-message">
                <div className="secondary-message-header">
                  <div>
                    <span className="rank-label">#2</span>

                    <h3>{second.name}</h3>
                  </div>

                  <strong>
                    {(Number(second.hybrid_score) * 100).toFixed(2)}%
                  </strong>
                </div>

                <p className="message-text">
                  You share their {formatTraits(secondMessage.traits)}.
                </p>
              </article>
            )}

            {third && thirdMessage && (
              <article className="character-message secondary-message">
                <div className="secondary-message-header">
                  <div>
                    <span className="rank-label">#3</span>

                    <h3>{third.name}</h3>
                  </div>

                  <strong>
                    {(Number(third.hybrid_score) * 100).toFixed(2)}%
                  </strong>
                </div>

                <p className="message-text">
                  They would probably recognise your{" "}
                  {formatTraits(thirdMessage.traits)}.
                </p>
              </article>
            )}
          </section>

          {/* FULL RANKING */}

          <section className="ranking-board">
            <h2>Full ranking</h2>

            {ranking.map((character, index) => (
              <div
                className={`ranking-row ${
                  index === 0 ? "ranking-winner" : ""
                }`}
                key={character.name || `character-${index}`}
              >
                <span>{index + 1}</span>

                <strong>{character.name}</strong>

                <span>
                  {(Number(character.hybrid_score) * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </section>

          {/* RESTART */}

          <button
            type="button"
            className="restart-button"
            onClick={restartQuiz}
          >
            Take the quiz again
          </button>

          {/* EXPLANATION */}

          <div className="score-explanation">
            <h3>A note about your result</h3>

            <p>
              This quiz is a fun personality match, not a definitive
              personality assessment. Your result shows which character’s
              profile most closely resembles your answers in this quiz —
              it doesn’t mean you’re actually that character!
            </p>

            <p>
              The trait profile above shows
              <strong> {" "}{winner.name}'s character profile</strong>{" "}
              used by the quiz as part of the matching system. It describes
              the characteristics assigned to that character in the quiz,
              rather than measuring you directly.
            </p>

            <p>
              Your match is based on the complete pattern of your answers
              across all {totalQuestions} questions. The character profile
              is then compared with that pattern to determine which
              character is the closest match.
            </p>

            <h3>How your match is calculated</h3>

            <p>
              <strong>Shape similarity</strong> measures how closely your
              overall pattern of answers matches the character’s pattern.
            </p>

            <p>
              <strong>Proximity Similarity</strong> measures how close your answers are to the character's position in the underlying trait space. Values closer to 1 indicate a closer match; values closer to 0 indicate a more distant match.
            </p>

            <p>
              The final match combines both measures to produce your
              character ranking.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question = questions[currentQuestion];

  if (!question) {
    return (
      <main className="app">
        <div className="error-screen">
          <h1>Something went wrong</h1>

          <p>The requested question could not be found.</p>

          <button type="button" onClick={restartQuiz}>
            Restart quiz
          </button>
        </div>
      </main>
    );
  }

  const selectedAnswer = answers[question.id];

  const isLastQuestion = currentQuestion === totalQuestions - 1;

  const progressPercentage =
    ((currentQuestion + 1) / totalQuestions) * 100;



  // ============================================================
  // WELCOME SCREEN
  // ============================================================

  if (!hasStarted) {
    return (
      <main className="app">
        <section className="welcome-screen">
          <div className="welcome-content">
            <span className="welcome-eyebrow">
              THE WIZARDING WORLD
            </span>

            <div className="welcome-art">
              <img
                src="/hogwarts.jpg"
                alt="Hogwarts castle"
                className="welcome-image"
              />
            </div>

            <p className="image-copyright">
              Image: GunnerVV / Wikimedia Commons ·
              <a
                href="https://creativecommons.org/licenses/by/2.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 2.0
              </a>
            </p>

            <h1 className="welcome-title">
              Which Harry Potter
              <br />
              Character Are You?
            </h1>

            <p className="welcome-description">
              Discover the character who best matches your personality,
              your choices and the way you see the world.
            </p>

            <div className="welcome-details">
              <span>✧ {totalQuestions} Questions</span>
              <span>✧ 24 Characters</span>
            </div>

            <button
              type="button"
              className="welcome-button"
              onClick={startQuiz}
            >
              BEGIN YOUR JOURNEY <span>↗</span>
            </button>

            <p className="welcome-note">
              No right or wrong answers. Just you.
            </p>

            {/* UPCOMING F1 QUIZ */}
            <div className="upcoming-quiz">
              <span className="upcoming-quiz-eyebrow">
                YOUR NEXT CHALLENGE
              </span>

              <h2 className="upcoming-quiz-title">
                Find Your F1 Profile
              </h2>

              <p className="upcoming-quiz-description">
                Discover which driver, constructor and circuit
                match your personality.
              </p>

              <span className="upcoming-quiz-badge">
                COMING SOON
              </span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // ============================================================
  // QUIZ SCREEN
  // ============================================================

  return (
    <main className="app">
      <section className="quiz-screen">
        <header className="quiz-header">
          <div>
            <span className="question-number">
              Question {currentQuestion + 1}
            </span>

            <span className="question-total">
              {" "}
              / {totalQuestions}
            </span>
          </div>

          <div
            className="progress"
            role="progressbar"
            aria-valuemin="1"
            aria-valuemax={totalQuestions}
            aria-valuenow={currentQuestion + 1}
            aria-label={`Question ${
              currentQuestion + 1
            } of ${totalQuestions}`}
          >
            <div
              className="progress-bar"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </header>

        <section className="question">
          <p className="question-title">{question.title}</p>

          <h1>{question.question}</h1>

          <div className="options">
            {ANSWER_IDS.map((answerId) => {
              const selected = selectedAnswer === answerId;

              return (
                <button
                  key={answerId}
                  type="button"
                  className={`option ${selected ? "selected" : ""}`}
                  onClick={() => selectAnswer(answerId)}
                  aria-pressed={selected}
                  disabled={loading}
                >
                  <span className="option-letter">{answerId}</span>

                  <span className="option-text">
                    {question.options?.[answerId]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* NAVIGATION */}

        <footer className="quiz-navigation">
          <button
            type="button"
            onClick={previousQuestion}
            disabled={currentQuestion === 0 || loading}
          >
            Back
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={!selectedAnswer || loading}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submitQuiz}
              disabled={
                !selectedAnswer ||
                Object.keys(answers).length !== totalQuestions ||
                loading
              }
            >
              {loading ? "Calculating..." : "Reveal my character"}
            </button>
          )}
        </footer>

        {/* ERROR MESSAGE */}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;