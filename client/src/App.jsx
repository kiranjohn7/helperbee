// client/src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Hirer from "./pages/dashboard/Hirer.jsx";
import Worker from "./pages/dashboard/Worker.jsx";
import HirerProfile from "./pages/profile/HirerProfile.jsx";
import WorkerProfile from "./pages/profile/WorkerProfile.jsx";
import PostJob from "./pages/jobs/PostJob.jsx";
import JobDetail from "./pages/jobs/JobDetail.jsx";
import Chat from "./pages/chat/Chat.jsx";

// NEW: static pages
import About from "./pages/static/About.jsx";
import Contact from "./pages/static/Contact.jsx";

// Gate posting to hirers only
import RoleGate from "./components/RoleGate.jsx";

export default function App() {
  return (
    <>
      <Header />

      {/* Shared page container */}
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />          {/* NEW */}
          <Route path="/contact" element={<Contact />} />      {/* NEW */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/chat/:conversationId" element={<Chat />} />

          {/* Dashboards (your pages already enforce role via RoleGate internally) */}
          <Route path="/dashboard/hirer" element={<Hirer />} />
          <Route path="/dashboard/worker" element={<Worker />} />

          {/* Profiles (same note as above) */}
          <Route path="/profile/hirer" element={<HirerProfile />} />
          <Route path="/profile/worker" element={<WorkerProfile />} />

          {/* Posting a job: EXPLICITLY gate to hirers here */}
          <Route
            path="/jobs/post"
            element={
              <RoleGate role="hirer">
                <PostJob />
              </RoleGate>
            }
          />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

/* --- tiny inline 404 component, or move to its own file later --- */
function NotFound() {
  return (
    <div className="min-h-[40vh] grid place-items-center text-center">
      <div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-gray-600 mt-1">
          The page you&apos;re looking for doesn’t exist.
        </p>
      </div>
    </div>
  );
}