import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          🚦
        </div>

        <h1>Traffic Flow Optimizer</h1>

        <p className="auth-subtitle">
          Login to your traffic management dashboard
        </p>

        <form onSubmit={handleLogin}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            required
          />

          <div className="forgot-link">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-button"
          >
            Login
          </button>

        </form>

        <p className="auth-bottom">
          Don't have an account?

          <Link to="/register">
            Register
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login