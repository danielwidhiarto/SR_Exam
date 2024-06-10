import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

export default function NavbarComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [greeting, setGreeting] = useState("Guest");
  const [homeRoute, setHomeRoute] = useState("/");
  const navigate = useNavigate();

  useEffect(() => {
    invoke("get_current_user").then((user) => {
      console.log(user);
      setUser(user as User);
    }).catch((error) => {
      console.error("Failed to get current user:", error);
    });
  }, []);

  useEffect(() => {
    if (user) {
      setGreeting(`Hello, ${user.nim ? user.nim + ' - ' + user.name : user.initial}`);
      setHomeRoute(determineHomeRoute(user.login_type));
    }
  }, [user]);

  const determineHomeRoute = (loginType: "nim" | "initial") => {
    return loginType === "nim" ? "/home" : "/dashboard";
  };

  const handleLogout = async () => {
    await invoke("logout");
    setUser(null);
    navigate("/");
  };

  const renderProfileName = (user: User | null) => {
    if (!user) {
      return "Guest";
    }
    return user.login_type === "nim" ? `${user.nim} – ${user.name}` : user.initial || "Guest";
  };

  const renderNavLinks = (role: string) => {
    switch (role) {
      case "Subject Development":
        return (
          <>
            <RouterLink className="nav-link" to="/view-transaction">
              View Transaction
            </RouterLink>
            <RouterLink className="nav-link" to="/subject-management">
              Subject Management
            </RouterLink>
            <RouterLink className="nav-link" to="/report-management">
              Report Management
            </RouterLink>
          </>
        );
      case "Exam Coordinator":
        return (
          <>
            <RouterLink className="nav-link" to="/view-transaction">
              View Transaction
            </RouterLink>
            <RouterLink className="nav-link" to="/view-schedule">
              View Schedule
            </RouterLink>
            <RouterLink className="nav-link" to="/assistant-exam-scheduler">
              Assistant Exam Scheduler
            </RouterLink>
            <RouterLink className="nav-link" to="/student-exam-scheduler">
              Student Exam Scheduler
            </RouterLink>
            <RouterLink className="nav-link" to="/subject-management">
              Subject Management
            </RouterLink>
            <RouterLink className="nav-link" to="/user-management">
              User Management
            </RouterLink>
            <RouterLink className="nav-link" to="/room-management">
              Room Management
            </RouterLink>
            <RouterLink className="nav-link" to="/report-management">
              Report Management
            </RouterLink>
          </>
        );
      default:
        return <></>;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <RouterLink to={homeRoute} className="navbar-brand">
          <img
            src="src/assets/logo-no-background.png"
            alt="Logo SR Exam"
            width={100}
          />
        </RouterLink>
        <div className="" id="navbarNavAltMarkup">
          <div className="navbar-nav">
            {user ? renderNavLinks(user.role) : null}
          </div>
        </div>
        <div className="dropdown ms-auto">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownMenuButton1"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {renderProfileName(user)}
          </button>
          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton1" style={{ textAlign: "left" }}>
            {user ? (
              <>
                <li>
                  <RouterLink className="dropdown-item" to="/profile-page">
                    <i className="bi bi-person"></i> Profile
                  </RouterLink>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <RouterLink className="dropdown-item" to="/">
                  <i className="bi bi-box-arrow-in-right"></i> Sign in
                </RouterLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}