import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App.jsx";
import { auth0Config, hasAuth0Config } from "./config/auth";

const app = <App authConfigured={hasAuth0Config} />;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {hasAuth0Config ? (
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={{
          audience: auth0Config.audience,
          redirect_uri: window.location.origin,
        }}
        cacheLocation="localstorage"
        useRefreshTokens
      >
        {app}
      </Auth0Provider>
    ) : (
      app
    )}
  </StrictMode>
);
