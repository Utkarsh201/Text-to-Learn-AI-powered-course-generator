import SignupPage from "./pages/SignupPage";
import CourseSettingsPopup from "./pages/popup";
import { useState } from "react";

function App() {
  const [showPopup, setShowPopup] = useState(false);

  // Showing SignupPage for now — swap to <LoginPage /> to preview login
  return (
    <>
      <SignupPage onSignup={(provider) => console.log("Signup with:", provider)} />
      {/* <LoginPage onLogin={(provider) => console.log("Login with:", provider)} /> */}
      {/* <HomePage /> */}
      <CourseSettingsPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onGenerate={(settings) => {
          console.log("Generate course with:", settings);
          setShowPopup(false);
        }}
      />
    </>
  );
}

export default App;
