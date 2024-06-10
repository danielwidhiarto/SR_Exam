import NavbarComponent from "../components/NavbarComponent";
import "../css/ProfilePage.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { Link as RouterLink, useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await invoke("get_current_user");
      console.log("Fetched user:", user); // Log the user object
      setUser(user as User);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await invoke("logout");
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("All fields must be filled.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    try {
      const response = await invoke("change_password", {
        currentPassword,
        newPassword,
      });
      if (response === "Success") {
        setMessage("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage("Password change failed");
      }
    } catch (error) {
      setMessage("An error occurred while changing the password.");
    }
  };

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <div className="container">
        <div className="row flex-lg-nowrap">
          <div className="col">
            <div className="row">
              <div className="col mb-3">
                <div className="card">
                  <div className="card-body">
                    <div className="e-profile">
                      <div className="row">
                        <div className="col d-flex flex-column flex-sm-row justify-content-between mb-3">
                          <div className="text-center text-sm-left mb-2 mb-sm-0">
                            <h4 className="pt-sm-2 pb-1 mb-0 text-nowrap center">
                              Your Profile
                            </h4>
                          </div>
                          <div className="text-center text-sm-right">
                            <button
                              className="btn btn-block btn-dark"
                              onClick={handleLogout}
                            >
                              Logout
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="tab-content pt-3">
                        <div className="tab-pane active">
                          <form className="form" noValidate>
                            <div className="row">
                              <div className="col">
                                <div className="row">
                                  <div className="col">
                                    <div className="form-group mb-3">
                                      <label>BN Number</label>
                                      <input
                                        className="form-control"
                                        type="text"
                                        name="bn_number"
                                        placeholder="BN Number"
                                        value={user ? user.bn_number : ""}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                  <div className="col">
                                    <div className="form-group">
                                      <label>Name</label>
                                      <input
                                        className="form-control"
                                        type="text"
                                        name="name"
                                        placeholder="Name"
                                        value={user ? user.name : ""}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col">
                                    <div className="form-group mb-3">
                                      <label>Major</label>
                                      <input
                                        className="form-control"
                                        type="text"
                                        name="major"
                                        placeholder="Major"
                                        value={user ? user.major : ""}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                  <div className="col">
                                    <div className="form-group">
                                      <label>Initial</label>
                                      <input
                                        className="form-control"
                                        type="text"
                                        name="initial"
                                        placeholder="-"
                                        value={user ? user.initial : ""}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col">
                                    <div className="form-group">
                                      <label>NIM</label>
                                      <input
                                        className="form-control"
                                        type="text"
                                        name="NIM"
                                        placeholder="NIM"
                                        value={user ? user.nim : ""}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                  <div className="col">
                                    <div className="form-group">
                                      <label>Role</label>
                                      <input
                                        className="form-control"
                                        type="text"
                                        name="Role"
                                        placeholder="Role"
                                        value={user ? user.role : ""}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Change Password Container */}
            <div className="col mb-3">
              <div className="card">
                <div className="card-body">
                  <div className="mb-2">
                    <h4 className="pt-sm-2 pb-1 mb-0 text-nowrap center">
                      Change Password
                    </h4>
                  </div>
                  <form onSubmit={handleChangePassword}>
                    <div className="row">
                      <div className="col">
                        <div className="form-group mb-3">
                          <label>Current Password</label>
                          <input
                            className="form-control"
                            type="password"
                            placeholder="••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col">
                        <div className="form-group mb-3">
                          <label>New Password</label>
                          <input
                            className="form-control"
                            type="password"
                            placeholder="••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col">
                        <div className="form-group mb-3">
                          <label>
                            Confirm{" "}
                            <span className="d-none d-xl-inline">Password</span>
                          </label>
                          <input
                            className="form-control"
                            type="password"
                            placeholder="••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    {message && (
                      <div className="row">
                        <div className="col">
                          <div className="alert alert-info">{message}</div>
                        </div>
                      </div>
                    )}
                    <div className="row">
                      <div className="col d-flex justify-content-end">
                        <button className="btn btn-primary" type="submit">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            {/* End Change Password Container */}
          </div>
        </div>
      </div>
    </div>
  );
}