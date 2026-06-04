import "./Login.css";
import LoginFloatingEmbers from "./LoginFloatingEmbers";
import LoginLogo from "./LoginLogo";
import LoginForm from "./LoginForm";

const Login = () => {
  return (
    <main className="login-page">
      <div className="vignette"></div>
      <LoginFloatingEmbers />

      <div className="login-card" id="card">
        <LoginLogo />
        <LoginForm />
      </div>
    </main>
  );
};

export default Login;
