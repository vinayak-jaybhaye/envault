import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passphraseExists, setPassphraseExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  useEffect(() => {
    const checkPassphrase = async () => {
      try {
        const response = await fetch(`${API_URL}/passphrase-exists`,{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include', // Include cookies if needed

        });
        if (!response.ok) throw new Error("Failed to check passphrase");
        const data = await response.json();
        setPassphraseExists(data.exists);
      } catch (err) {
        console.error("Passphrase check failed:", err);
        setPassphraseExists(false);
      } finally {
        setLoading(false);
      }
    };
    checkPassphrase();
  }, []);

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("passphrase", newPassword);
      const response = await fetch(`${API_URL}/create-passphrase`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies if needed
      });
      setLoading(false);

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Creation failed.");
        return;
      }

      alert("Password created successfully.");
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error creating password.");
      setLoading(false);
    }
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (!oldPassword.trim()) {
      alert("Old password cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("old_passphrase", oldPassword);
      formData.append("new_passphrase", newPassword);
      console.log(formData)
      const response = await fetch(`${API_URL}/update-passphrase`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies if needed
      });

      setLoading(false);

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Change failed.");
        return;
      }

      alert("Password changed successfully.");
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error changing password.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Settings</h1>

      {loading ? (
        <p className="text-center text-gray-500">Checking vault status...</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            {passphraseExists ? "Change Vault Password" : "Create Vault Password"}
          </h2>

          <form className="space-y-4" onSubmit={passphraseExists ? handleChangePass : handleCreatePass}>
            {passphraseExists && (
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium mb-1">Old Password</label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors"
            >
              {passphraseExists ? "Change Password" : "Create Password"}
            </button>
            <button
              onClick={() => navigate("/")}
              disabled={loading}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Settings;
