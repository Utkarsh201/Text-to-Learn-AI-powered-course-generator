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

      let result;
      try {
        const token = await getToken();
        result = await generateCourse({ token, topic, settings });
      } catch (startError) {
        clearPollTimer();
        setStatus("FAILED");
        setError(startError.message || "Could not start course generation.");
        return null;
      }

      setRunId(result.generationRunId);
      setCourseId(result.courseId);
      setStatus("PENDING");
      const pollStatus = async () => {
        try {
          const pollToken = await getToken();
          const statusResult = await getGenerationStatus({
            token: pollToken,
            runId: result.generationRunId,
          });
          setStatus(statusResult.status || "RUNNING");

          if (statusResult.status === "COMPLETED") {
            clearPollTimer();
            await loadCourse(result.courseId);
            return;
          }

          if (statusResult.status === "FAILED") {
            clearPollTimer();
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
  };
};
