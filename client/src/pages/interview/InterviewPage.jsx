import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeUp,
  FaFileUpload,
  FaClipboardCheck,
} from "react-icons/fa";
import { server } from "../../main";
import "./interviewPage.css";

const InterviewPage = () => {
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("beginner");
  const [followUp, setFollowUp] = useState("");
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [finalReport, setFinalReport] = useState(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const speechBaseTextRef = useRef("");

  const speechSupport = useMemo(() => {
    const canSTT =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    const canTTS =
      typeof window !== "undefined" &&
      typeof window.speechSynthesis !== "undefined" &&
      typeof window.SpeechSynthesisUtterance !== "undefined";
    return { canSTT: Boolean(canSTT), canTTS: Boolean(canTTS) };
  }, []);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { token };
  }, []);

  useEffect(() => {
    if (!speechSupport.canSTT) return undefined;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript || "";
      }
      const next = `${speechBaseTextRef.current} ${transcript}`.trim();
      setCandidateAnswer(next);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [speechSupport.canSTT]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const readResumeFile = async (file) => {
    if (!file) return;

    const fileName = String(file.name || "");
    const isTextFile =
      file.type.startsWith("text/") || /\.(txt|md|json|csv)$/i.test(fileName);
    const isPdfFile = file.type === "application/pdf" || /\.pdf$/i.test(fileName);
    const isDocxFile =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.docx$/i.test(fileName);

    if (!isTextFile && !isPdfFile && !isDocxFile) {
      setError("Upload a TXT, PDF, or DOCX file. For other formats, paste resume text.");
      return;
    }

    setError("");
    setResumeFileName(fileName);
    setResumeLoading(true);

    try {
      if (isTextFile) {
        const text = await file.text();
        const normalizedText = String(text || "").trim();
        if (normalizedText.length < 50) {
          setResumeText(normalizedText);
          setError("Extracted text is too short. Please paste a fuller resume.");
          return;
        }
        setResumeText(normalizedText);
        return;
      }

      if (isPdfFile) {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: true });
        const pdf = await loadingTask.promise;
        let combinedText = "";
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => (item && "str" in item ? item.str : ""))
            .join(" ");
          combinedText += `${pageText}\n`;
        }
        const normalizedText = combinedText.trim();
        if (normalizedText.length < 50) {
          setError("Could not extract text from this PDF. Please paste resume text.");
          return;
        }
        setResumeText(normalizedText);
        return;
      }

      if (isDocxFile) {
        let mammothModule;
        try {
          mammothModule = await import("mammoth/mammoth.browser");
        } catch {
          mammothModule = await import("mammoth");
        }
        const mammoth = mammothModule?.default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const normalizedText = String(result?.value || "").trim();
        if (normalizedText.length < 50) {
          setError("Could not extract text from this DOCX. Please paste resume text.");
          return;
        }
        setResumeText(normalizedText);
      }
    } catch (readError) {
      setError("Unable to read this file. Please paste resume text instead.");
    } finally {
      setResumeLoading(false);
    }
  };

  const speakText = (text) => {
    if (!speechSupport.canTTS || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    speechBaseTextRef.current = String(candidateAnswer || "").trim();
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const startInterview = async () => {
    const cleanResume = String(resumeText || "").trim();
    if (cleanResume.length < 50) {
      setError("Please paste/upload a meaningful resume (minimum 50 characters).");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/interview/turn`,
        {
          resumeText: cleanResume,
          history: [],
        },
        { headers: authHeaders }
      );

      setInterviewStarted(true);
      setHistory([]);
      setFinalReport(null);
      setCandidateAnswer("");
      setCurrentQuestion(String(data?.question || ""));
      setCurrentDifficulty(String(data?.difficulty || "beginner"));
      setFollowUp(String(data?.follow_up || ""));
      if (data?.question) {
        speakText(data.question);
      }
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to start interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!interviewStarted || !currentQuestion.trim()) return;
    const answer = String(candidateAnswer || "").trim();
    if (!answer) {
      setError("Please provide your answer before submitting.");
      return;
    }

    setError("");
    setSubmittingAnswer(true);
    try {
      const { data } = await axios.post(
        `${server}/api/interview/turn`,
        {
          resumeText,
          currentQuestion,
          candidateAnswer: answer,
          history,
        },
        { headers: authHeaders }
      );

      const completedTurn = {
        question: currentQuestion,
        answer,
        difficulty: currentDifficulty,
        evaluation: data?.evaluation || null,
        follow_up: data?.follow_up || "",
      };

      setHistory((prev) => [...prev, completedTurn]);
      setCandidateAnswer("");
      setFollowUp(String(data?.follow_up || ""));

      if (data?.done) {
        setFinalReport(data?.finalReport || null);
        setCurrentQuestion("");
      } else {
        setCurrentQuestion(String(data?.question || ""));
        setCurrentDifficulty(String(data?.difficulty || "intermediate"));
        if (data?.question) {
          speakText(data.question);
        }
      }
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to submit answer. Please try again."
      );
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const resetInterview = () => {
    stopListening();
    if (speechSupport.canTTS && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setInterviewStarted(false);
    setLoading(false);
    setSubmittingAnswer(false);
    setCurrentQuestion("");
    setCurrentDifficulty("beginner");
    setCandidateAnswer("");
    setHistory([]);
    setFinalReport(null);
    setFollowUp("");
    setError("");
  };

  const isDone = Boolean(finalReport);

  return (
    <div className="interview-page">
      <section className="interview-setup-card">
        <h1>AI Mock Interview</h1>
        <p>
          Paste your resume, start interview, answer one question at a time, and get an
          AI evaluation + final report.
        </p>

        <div className="interview-upload-row">
          <label htmlFor="resume-file" className="interview-upload-btn">
            <FaFileUpload /> Upload Resume (TXT/PDF/DOCX)
          </label>
          <input
            id="resume-file"
            type="file"
            accept=".txt,.md,.json,.csv,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => readResumeFile(e.target.files?.[0])}
          />
          {resumeFileName && <span className="resume-file-name">{resumeFileName}</span>}
        </div>

        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste resume text here..."
          rows={10}
          disabled={interviewStarted && !isDone}
        />

        <div className="interview-meta-row">
          <span>Resume Length: {resumeText.trim().length} chars</span>
          <span>Completed Questions: {history.length}</span>
        </div>

        <div className="interview-action-row">
          {!interviewStarted || isDone ? (
            <button
              type="button"
              className="interview-primary-btn"
              onClick={startInterview}
              disabled={loading || resumeLoading}
            >
              {resumeLoading ? "Reading..." : loading ? "Starting..." : "Start Interview"}
            </button>
          ) : (
            <button
              type="button"
              className="interview-secondary-btn"
              onClick={resetInterview}
            >
              Reset Interview
            </button>
          )}
        </div>

        {error && <p className="interview-error">{error}</p>}
      </section>

      {interviewStarted && (
        <section className="interview-session-card">
          {!isDone ? (
            <>
              <div className="question-head">
                <h2>Current Question</h2>
                <span className={`difficulty-badge ${currentDifficulty}`}>
                  {currentDifficulty}
                </span>
              </div>

              <article className="question-box">
                <p>{currentQuestion}</p>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => speakText(currentQuestion)}
                  disabled={isSpeaking}
                  title="Speak question"
                >
                  <FaVolumeUp />
                </button>
              </article>

              {followUp && (
                <article className="follow-up-box">
                  <strong>Deeper Follow-up:</strong> {followUp}
                </article>
              )}

              <div className="answer-box">
                <label htmlFor="candidate-answer">Your Answer</label>
                <textarea
                  id="candidate-answer"
                  rows={7}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Explain clearly with practical implementation details..."
                />
                <div className="answer-controls">
                  {speechSupport.canSTT && (
                    <button
                      type="button"
                      className={`icon-btn ${isListening ? "recording" : ""}`}
                      onClick={isListening ? stopListening : startListening}
                      title={isListening ? "Stop microphone" : "Start microphone"}
                    >
                      {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>
                  )}
                  <button
                    type="button"
                    className="interview-primary-btn"
                    onClick={submitAnswer}
                    disabled={submittingAnswer}
                  >
                    {submittingAnswer ? "Evaluating..." : "Submit Answer"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="final-report-card">
              <h2>
                <FaClipboardCheck /> Final Interview Report
              </h2>
              <div className="score-grid">
                <div>
                  <span>Technical</span>
                  <strong>{finalReport?.technical_score || "0"}/10</strong>
                </div>
                <div>
                  <span>Communication</span>
                  <strong>{finalReport?.communication_score || "0"}/10</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{finalReport?.confidence_score || "0"}/10</strong>
                </div>
              </div>

              <div className="report-list-grid">
                <article>
                  <h3>Strengths</h3>
                  <ul>
                    {(finalReport?.strengths || []).map((item, idx) => (
                      <li key={`s-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Weak Topics</h3>
                  <ul>
                    {(finalReport?.weak_topics || []).map((item, idx) => (
                      <li key={`w-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Recommendations</h3>
                  <ul>
                    {(finalReport?.recommendations || []).map((item, idx) => (
                      <li key={`r-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <button
                type="button"
                className="interview-primary-btn"
                onClick={resetInterview}
              >
                Start New Interview
              </button>
            </div>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="interview-history-card">
          <h2>Interview Timeline</h2>
          <div className="history-list">
            {history.map((turn, index) => (
              <article key={`turn-${index}`} className="history-item">
                <div className="history-item-head">
                  <span>Q{index + 1}</span>
                  <span className={`difficulty-badge ${turn.difficulty}`}>
                    {turn.difficulty}
                  </span>
                  <strong>{turn?.evaluation?.score || "0"}/10</strong>
                </div>
                <p className="history-q">{turn.question}</p>
                <p className="history-a">{turn.answer}</p>
                <p className="history-feedback">
                  <strong>Feedback:</strong> {turn?.evaluation?.feedback || ""}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default InterviewPage;
