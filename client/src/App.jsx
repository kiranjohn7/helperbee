import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
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

export default function App() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/dashboard/hirer" element={<Hirer />} />
          <Route path="/dashboard/worker" element={<Worker />} />
          <Route path="/profile/hirer" element={<HirerProfile />} />
          <Route path="/profile/worker" element={<WorkerProfile />} />
          <Route path="/jobs/post" element={<PostJob />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
        </Routes>
      </main>
    </>
  );
}