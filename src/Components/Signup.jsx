import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

function Signup() {

  const navigate = useNavigate();

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSignup = (e)=>{
    e.preventDefault();

    if(name === "" || email === "" || password === ""){
      alert("Please fill all fields");
      return;
    }

    console.log(name,email,password);

    alert("Account created successfully");

    navigate("/");
  }

  return (

    <div style={styles.container}>

      <div style={styles.box}>

        <div style={styles.brand}>
          <img src="logo.png" alt="logo" style={styles.logo}/>
          <h2 style={styles.title}>
            Ayur<span style={{color:"#1f8a70"}}>Pulse</span>
          </h2>
        </div>

        <p style={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSignup}>

          <input
            type="text"
            placeholder="Name"
            style={styles.input}
            required
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            required
            onChange={(e)=>setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            required
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button style={styles.button}>Sign Up</button>

        </form>

        <p style={styles.text}>
          Already have an account? <Link to="/">Login</Link>
        </p>

      </div>

    </div>
  );
}

const styles = {

  container:{
    height:"100vh",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    background:"#f4f6f9"
  },

  box:{
    background:"white",
    padding:"50px",
    borderRadius:"12px",
    width:"420px",
    textAlign:"center",
    boxShadow:"0 10px 25px rgba(0,0,0,0.1)"
  },

  brand:{
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    gap:"10px",
    marginBottom:"10px"
  },

  logo:{
    width:"35px",
    height:"35px"
  },

  title:{
    fontSize:"28px",
    fontWeight:"700",
    color:"#1f2937"
  },

  subtitle:{
    marginBottom:"25px",
    color:"#6b7280",
    fontSize:"14px"
  },

  input:{
    width:"100%",
    padding:"12px",
    margin:"12px 0",
    border:"1px solid #ccc",
    borderRadius:"6px",
    fontSize:"14px"
  },

  button:{
    width:"100%",
    padding:"12px",
    marginTop:"10px",
    background:"#1f8a70",
    color:"white",
    border:"none",
    borderRadius:"6px",
    fontSize:"16px",
    cursor:"pointer"
  },

  text:{
    marginTop:"20px"
  }

};

export default Signup;