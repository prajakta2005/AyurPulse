import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "" || password === "") {
      alert("Please enter email and password");
      return;
    }

    // TODO: add backend auth here
    console.log(email, password);
    alert("Login successful");
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        {/* Brand */}
        <div style={styles.brand}>
          <img src="logo.png" alt="AyurPulse Logo" style={styles.logo} />
          <h2 style={styles.title}>
            Ayur<span style={{ color: "#1f8a70" }}>Pulse</span>
          </h2>
        </div>

        <p style={styles.subtitle}>Login to your account</p>

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p style={styles.text}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f9",
  },
  box: {
    background: "white",
    padding: "50px",
    borderRadius: "12px",
    width: "420px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  brand: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  logo: {
    width: "80px",
    height: "80px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    marginBottom: "25px",
    color: "#6b7280",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "12px 0",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    background: "#1f8a70",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  },
  text: {
    marginTop: "20px",
  },
};

export default Login;