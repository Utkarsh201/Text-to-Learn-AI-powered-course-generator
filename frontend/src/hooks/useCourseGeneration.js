import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateCourse,
  getCourseById,
  getGenerationStatus,
} from "../services/courseService";

const POLL_INTERVAL_MS = 2500;

export const useCourseGeneration = (getToken) => {
  const pollTimerRef = useRef(null);
  const [runId, setRunId] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [status, setStatus] = useState("IDLE");
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState("IDLE");
  const [progressMessage, setProgressMessage] = useState("");

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const loadCourse = useCallback(
    async (nextCourseId) => {
      const token = await getToken();
      const generatedCourse = await getCourseById({ token, courseId: nextCourseId });
      setCourse(generatedCourse);
      return generatedCourse;
    },
    [getToken]
  );

  const startGeneration = useCallback(
    async ({ topic, settings }) => {
      clearPollTimer();
      setRunId(null);
      setCourseId(null);
      setError(null);
      setCourse(null);
      setStatus("QUEUING");
      setProgressPercent(5);
      setProgressStage("QUEUING");
      setProgressMessage("Sending your topic to the intelligence engine...");

      let result;
      try {
        const token = await getToken();
        result = await generateCourse({ token, topic, settings });
      } catch (startError) {
        clearPollTimer();
        setStatus("FAILED");
        setProgressPercent(0);
        setProgressStage("FAILED");
        setError(startError.message || "Could not start course generation.");
        return null;
      }

      setRunId(result.generationRunId);
      setCourseId(result.courseId);
      setStatus("PENDING");
      setProgressPercent(10);
      setProgressStage("STARTING");
      setProgressMessage("Warming up the AI intelligence engine...");

      const pollStatus = async () => {
        try {
          const pollToken = await getToken();
          const statusResult = await getGenerationStatus({
            token: pollToken,
            runId: result.generationRunId,
          });
          setStatus(statusResult.status || "RUNNING");
          if (typeof statusResult.progressPercent === "number") {
            setProgressPercent(statusResult.progressPercent);
          }
          if (statusResult.progressStage) {
            setProgressStage(statusResult.progressStage);
          }
          if (statusResult.progressMessage) {
            setProgressMessage(statusResult.progressMessage);
          }

          if (statusResult.status === "COMPLETED") {
            clearPollTimer();
            setProgressPercent(100);
            setProgressStage("COMPLETED");
            setProgressMessage("Your course is ready!");
            await loadCourse(result.courseId);
            return;
          }

          if (statusResult.status === "FAILED") {
            clearPollTimer();
            setProgressPercent(0);
            setProgressStage("FAILED");
            setError(statusResult.error || "Course generation failed.");
            return;
          }

          pollTimerRef.current = window.setTimeout(pollStatus, POLL_INTERVAL_MS);
        } catch (pollError) {
          clearPollTimer();
          setError(pollError.message || "Could not check generation status.");
        }
      };

      pollStatus();
      return result;
    },
    [clearPollTimer, getToken, loadCourse]
  );

  const resetGeneration = useCallback(() => {
    clearPollTimer();
    setRunId(null);
    setCourseId(null);
    setStatus("IDLE");
    setError(null);
    setCourse(null);
    setProgressPercent(0);
    setProgressStage("IDLE");
    setProgressMessage("");
  }, [clearPollTimer]);

  useEffect(() => clearPollTimer, [clearPollTimer]);

  return {
    course,
    courseId,
    error,
    isGenerating: ["QUEUING", "PENDING", "RUNNING"].includes(status),
    loadCourse,
    resetGeneration,
    runId,
    startGeneration,
    status,
    progressPercent,
    progressStage,
    progressMessage,
  };
};
