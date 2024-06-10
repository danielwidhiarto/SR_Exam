import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";

export default function LoginPage() {
  
  const[subjects, setSubject] = useState<Subject[]>([]);

  useEffect(() => {
    invoke("get_all_subject", {}).then((rooms) => {
      console.log(rooms);
      setSubject(rooms as Subject[]); 
    });
  }, []);  // <-- Add this empty array  
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const login = () => {
    invoke("login", formData).then((userType) => {
      if (userType === "nim") {
        navigate("/home", { replace: true });
      } else if (userType === "initial") {
        navigate("/dashboard", { replace: true });
      } else {
        setError("Invalid username or password.");
      }
    }).catch(() => {
      setError("An error occurred during login.");
    });
  };

  return (
    <div className="login-container">
      <img src="src/assets/logo-white.png" alt="Logo" className="logo" />
      <form className="login-form">
        <div className="form-content">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="exampleInputEmail1" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control custom-input"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Username"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="exampleInputPassword1" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control custom-input"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
            />
          </div>
          <button
            type="button"
            onClick={login}
            className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}