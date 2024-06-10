import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./routes/HomePage";
import HomePageStudent from "./routes/HomePageStudent";
import LoginPage from "./routes/LoginPage";
import ProfilePage from "./routes/ProfilePage";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import SubjectManagementPage from "./routes/SubjectManagementPage";
import RoomManagementPage from "./routes/RoomManagementPage";
import UserManagementPage from "./routes/UserManagementPage";
import StudentExamSchedulerPage from "./routes/StudentExamSchedulerPage";
import AssistantExamSchedulerPage from "./routes/AssistantExamSchedulerPage";
import ViewTransactionPage from "./routes/ViewTransactionPage";
import ViewSchedulePage from "./routes/ViewSchedulePage";
import ReportManagementPage from "./routes/ReportManagementPage";

const router = createBrowserRouter([
  {
    
    path: "/",
    element: <LoginPage />
  },
  {
    path: "/home",
    element: <HomePageStudent/>
  },
  {
    path: "/dashboard",
    element: <HomePage/>
  },
  {
    path: "/view-transaction",
    element: <ViewTransactionPage/>
  },
  {
    path: "/view-schedule",
    element: <ViewSchedulePage/>
  },
  {
    path: "/assistant-exam-scheduler",
    element: <AssistantExamSchedulerPage/>
  },
  {
    path: "/student-exam-scheduler",
    element: <StudentExamSchedulerPage/>
  },
  {
    path: "/subject-management",
    element: <SubjectManagementPage/>
  },
  {
    path: "/room-management",
    element: <RoomManagementPage/>
  },
  {
    path: "/user-management",
    element: <UserManagementPage/>
  },
  {
    path: "/report-management",
    element: <ReportManagementPage/>
  },
  {
    path: "/profile-page",
    element: <ProfilePage/>
  }
])

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <RouterProvider router={router} />
  </React.StrictMode>
);