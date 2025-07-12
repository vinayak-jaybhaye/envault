import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../components/AuthContext';

function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, isAuthenticated, authLoading } = useAuth();

  useEffect(() => {
    // Redirect to home if already authenticated
    if (!loading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading]);



  const handleLogin = async () => {
    if (!password.trim()) {
      alert("Password cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const formData = new URLSearchParams();
      formData.append("password", password);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        navigate("/");
      } else {
        alert(data.error || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <form className="bg-gray-600 p-6 rounded-lg shadow-2xl w-full max-w-sm" onSubmit={(e) => {
        e.preventDefault();
        handleLogin()
      }} >
        <h1 className="text-2xl text-white font-bold mb-4 text-center">Login to EnVault</h1>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          type='submit'
          className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm text-white text-center mt-4">
          Please enter the password to access the application.
        </p>
      </form>
    </div>
  );
}

export default Login;
