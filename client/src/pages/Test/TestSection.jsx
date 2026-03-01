import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import './TestSection.css';
import { server } from '../../main';

const TestSection = () => {
  const location = useLocation();
  const { domainName } = location.state || {};
  const domain = domainName || 'Domain';

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateQuestions = async (domain, retries = 5, delay = 1000) => {
    try {
      const response = await fetch(`${server}/api/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, numQuestions: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429 && retries > 0) {
          console.warn(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return generateQuestions(domain, retries - 1, delay * 2); // Exponential backoff
        }

        throw new Error(errorData.error || 'Failed to generate questions');
      }

      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error('Question generation failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      const cachedQuestions = localStorage.getItem(`questions-${domain}`);

      if (cachedQuestions) {
        setQuestions(JSON.parse(cachedQuestions));
        setLoading(false);
        return;
      }

      try {
        const questions = await generateQuestions(domain);
        setQuestions(questions);
        localStorage.setItem(`questions-${domain}`, JSON.stringify(questions)); // Store in cache
        setError(null);
      } catch (err) {
        if (err.message.includes('quota') || err.message.includes('429')) {
          setError('Rate limit exceeded. Please try again later.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [domain]);

  if (testCompleted) {
    return <Result score={score} totalQuestions={questions.length} onRestart={handleRestartTest} />;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Generating questions for {domain}...</p>
      </div>
    );
  }

  return (
    <div className="test-section">
      <Question
        question={questions[currentQuestionIndex]}
        selectedOption={selectedOption}
        onOptionSelect={setSelectedOption}
      />
    </div>
  );
};

// Updated Question Component
const Question = ({ question, selectedOption, onOptionSelect }) => {
  return (
    <div className="question-container">
      <h3>{question.question}</h3>
      <ul>
        {question.options.map((option, index) => (
          <li key={index}>
            <label>
              <input
                type="radio"
                name="option"
                value={option}
                checked={selectedOption === option}
                onChange={() => onOptionSelect(option)}
              />
              <span className="option-text">{option}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestSection;
