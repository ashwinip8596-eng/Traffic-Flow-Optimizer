import { Link } from 'react-router-dom'

function ForgotPassword() {

  const handleReset = (e) => {
    e.preventDefault()

    alert('Password reset link will be added with Firebase.')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          🔑
        </div>

        <h1>Forgot Password?</h1>

        <p className="auth-subtitle">
          Enter your email to reset your password
        </p>

        <form onSubmit={handleReset}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your registered email"
            required
          />

          <button
            type="submit"
            className="auth-button"
          >
            Send Reset Link
          </button>

        </form>

        <p className="auth-bottom">

          <Link to="/login">
            ← Back to Login
          </Link>

        </p>

      </div>
    </div>
  )
}

export default ForgotPassword