import { request } from "./apiClient";

const normalizeDepth = (depth) => String(depth || "BASIC").toUpperCase();

export const syncUserProfile = (token) => {
  return request("/api/auth/login", {
    method: "POST",
    token,
  });
};

export const generateCourse = ({ token, topic, settings }) => {
  return request("/api/courses/generate", {
    method: "POST",
    token,
    body: {
      topic,
      depth: normalizeDepth(settings?.depth),
      language: "ENGLISH",
      options: {
        quiz: Boolean(settings?.includeQuizzes),
        videoReferences: Boolean(settings?.includeVideoReferences),
        pdf: false,
      },
    },
  });
};

export const getGenerationStatus = ({ token, runId }) => {
  return request(`/api/courses/status/${runId}`, { token });
};

export const getCourseById = ({ token, courseId }) => {
  return request(`/api/courses/${courseId}`, { token });
};

export const revealQuizAnswers = ({ token, courseId, quizId }) => {
  return request(`/api/courses/${courseId}/quiz/${quizId}/reveal`, { token });
};

export const getUserCourses = ({ token, page = 1, limit = 20 }) => {
  return request(`/api/courses?page=${page}&limit=${limit}`, { token });
};

export const deleteCourse = ({ token, courseId }) => {
  return request(`/api/courses/${courseId}`, {
    method: "DELETE",
    token,
  });
};

