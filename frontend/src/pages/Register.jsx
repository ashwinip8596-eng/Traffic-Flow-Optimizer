import { Link, useNavigate } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()

  const handleRegister = (e) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          🚦
        </div>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Register for Traffic Flow Optimizer
        </p>

        <form onSubmit={handleRegister}>

          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            required
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            required
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
            required
          />

          <button
            type="submit"
            className="auth-button"
          >
            Register
          </button>

        </form>

        <p className="auth-bottom">
          Already have an account?

          <Link to="/login">
            Login
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register