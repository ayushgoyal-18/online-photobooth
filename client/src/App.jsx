import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

const Home           = lazy(() => import("./pages/Home"));
const CreateBooth    = lazy(() => import("./pages/CreateBooth"));
const JoinBooth      = lazy(() => import("./pages/JoinBooth"));
const Room           = lazy(() => import("./pages/Room"));
const PhotostripView = lazy(() => import("./pages/PhotostripView"));
const NotFound       = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--text-sub)" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--violet-lt)", margin: "0 auto 12px", animation: "pulse 1s ease-in-out infinite" }} />
        <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.02em" }}>Loading Framoji…</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                element={<Home />} />
            <Route path="/create"          element={<CreateBooth />} />
            <Route path="/join"            element={<JoinBooth />} />
            <Route path="/room/:roomId"    element={<Room />} />
            <Route path="/strip/:stripId"  element={<PhotostripView />} />
            <Route path="*"                element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
