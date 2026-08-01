import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CourseSettingsPopup from "./pages/popup";
import Homepage from "./pages/homepage";
import LoginPage from "./pages/LoginPage";
import MainContent from "./pages/maincontent";
import SignupPage from "./pages/SignupPage";
import { auth0Config } from "./config/auth";
import { useCourseGeneration } from "./hooks/useCourseGeneration";
import { getCourseById, revealQuizAnswers, syncUserProfile } from "./services/courseService";

function AuthSetupNotice() {
  return (
    <div className="min-h-screen bg-background px-6 py-20 text-on-surface">
      <main className="mx-auto max-w-2xl rounded-lg border border-outline-variant/30 bg-surface-container-low p-8 shadow-2xl">
        <span className="material-symbols-outlined mb-6 block text-4xl text-tertiary-fixed">
          lock
        </span>
        <h1 className="font-headline text-4xl font-black tracking-tight">
          Auth0 frontend setup needed
        </h1>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          The backend course APIs require an Auth0 access token. Add these values
          to <span className="font-semibold text-on-surface">frontend/.env</span>
          before using course generation.
        </p>
        <pre className="mt-6 overflow-auto rounded-lg bg-surface-container-high p-4 text-xs text-on-surface-variant">
{`VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
VITE_BACKEND_URL=http://localhost:5000`}
        </pre>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
      <div className="text-center">
        <span className="material-symbols-outlined mb-4 block text-5xl text-tertiary-fixed">
          auto_awesome
        </span>
        <p className="font-body text-sm uppercase tracking-[0.2em] text-on-surface-variant">
          Preparing Text to Learn
        </p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const {
    error: authError,
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    user,
  } = useAuth0();

  const [authMode, setAuthMode] = useState("signup");
  const [syncError, setSyncError] = useState(null);
  const [isSyncingUser, setIsSyncingUser] = useState(false);
  const [view, setView] = useState("home");
  const [pendingTopic, setPendingTopic] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  const getToken = useCallback(() => {
    return getAccessTokenSilently({
      authorizationParams: {
        audience: auth0Config.audience,
      },
    });
  }, [getAccessTokenSilently]);

  const generation = useCourseGeneration(getToken);

  const login = useCallback(
    (screenHint = "login") => {
      loginWithRedirect({
        authorizationParams: {
          audience: auth0Config.audience,
          screen_hint: screenHint,
        },
      });
    },
    [loginWithRedirect]
  );

  const logoutUser = useCallback(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isCurrent = true;

    Promise.resolve()
      .then(() => {
        if (isCurrent) {
          setIsSyncingUser(true);
          setSyncError(null);
        }
        return getToken();
      })
      .then((token) => syncUserProfile(token))
      .catch((error) => {
        if (isCurrent) {
          setSyncError(error.message || "Could not sync your profile.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsSyncingUser(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [getToken, isAuthenticated]);

  const openCourse = useCallback(async (courseOrId) => {
    const courseId = typeof courseOrId === "string" ? courseOrId : courseOrId?.id;
    if (!courseId) return;

    try {
      setIsLoadingCourse(true);
      const token = await getToken();
      const fullCourse = await getCourseById({ token, courseId });
      setActiveCourse(fullCourse);
      setView("course");
    } catch (error) {
      console.error("Failed to load full course details:", error);
      if (typeof courseOrId === "object" && courseOrId !== null) {
        setActiveCourse(courseOrId);
        setView("course");
      }
    } finally {
      setIsLoadingCourse(false);
    }
  }, [getToken]);

  const openCourseSettings = useCallback((topic) => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;

    setPendingTopic(cleanTopic);
    setIsSettingsOpen(true);
  }, []);

  const startCourseGeneration = useCallback(
    async (settings) => {
      setIsSettingsOpen(false);
      await generation.startGeneration({
        topic: pendingTopic,
        settings,
      });
      setView("home");
    },
    [generation, pendingTopic]
  );

  const revealAnswers = useCallback(
    async ({ courseId, quizId }) => {
      const token = await getToken();
      return revealQuizAnswers({ token, courseId, quizId });
    },
    [getToken]
  );

  const handleCourseDeleted = useCallback(
    (deletedCourseId) => {
      if (activeCourse?.id === deletedCourseId) {
        setActiveCourse(null);
      }
      if (generation?.course?.id === deletedCourseId || generation?.courseId === deletedCourseId) {
        generation.resetGeneration();
      }
    },
    [activeCourse?.id, generation]
  );

  const authActions = useMemo(
    () => ({
      login: () => login("login"),
      signup: () => login("signup"),
      logout: logoutUser,
    }),
    [login, logoutUser]
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return authMode === "login" ? (
      <LoginPage
        authError={authError?.message}
        onLogin={authActions.login}
        onSwitchToSignup={() => setAuthMode("signup")}
      />
    ) : (
      <SignupPage
        authError={authError?.message}
        onSignup={authActions.signup}
        onSwitchToLogin={() => setAuthMode("login")}
      />
    );
  }

  return (
    <>
      {view === "course" && activeCourse ? (
        <MainContent
          course={activeCourse}
          onBack={() => setView("home")}
          onRevealQuiz={revealAnswers}
        />
      ) : (
        <Homepage
          generation={generation}
          getToken={getToken}
          isSyncingUser={isSyncingUser}
          latestCourse={activeCourse || generation.course}
          onCreateCourse={openCourseSettings}
          onCourseDeleted={handleCourseDeleted}
          onLogout={logoutUser}
          onOpenCourse={openCourse}
          isLoadingCourse={isLoadingCourse}
          syncError={syncError}
          user={user}
        />
      )}

      <CourseSettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onGenerate={startCourseGeneration}
      />
    </>
  );
}

export default function App({ authConfigured }) {
  if (!authConfigured) {
    return <AuthSetupNotice />;
  }

  return <AuthenticatedApp />;
}
