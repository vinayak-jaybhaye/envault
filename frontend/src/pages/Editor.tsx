import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MonacoEditor from "../components/MonacoEditor";
import { API_URL } from "../config";
import { useAuth } from "../components/AuthContext";


interface EditorState {
  content: string;
  passphrase: string;
  project: string;
}

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);


  const [localState, setLocalState] = useState<EditorState | null>(null);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    const state = location.state as EditorState | null;

    if (!state || !state.passphrase || !state.project) {
      // Missing or invalid state → redirect
      navigate("/", { replace: true });
      return;
    }

    // Copy to local state
    setLocalState(state);
    setContent(state.content || "");

    // Clear location.state from history
    navigate(location.pathname, { replace: true, state: null });
  }, []);

  if (!isAuthenticated) return null;
  if (!localState) return null; // Don't render until local state is set

  const handleChange = (value: string) => {
    setContent(value);
  };

  const handleSave = async () => {
    if (!localState?.passphrase || !localState?.project) {
      alert("Missing project information. Please try again.");
      return;
    }

    if (localState.content === content) {
      navigate(-1); // No changes made
      return;
    }

    try {
      const response = await fetch(`${API_URL}/upload-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({
          project_name: localState.project,
          passphrase: localState.passphrase,
          data: content,
          update: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to save changes");
      }

      alert("Project saved successfully!");
      navigate(-1); // Navigate back

    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
    }
  };


  const handleCancel = () => {
    // Navigate back to the previous page
    navigate(-1);
  }

  return (
    <div className="p-6">
      <MonacoEditor
        content={content}
        onChange={handleChange}
      />
      <h1 className="text-2xl font-semibold mb-4">
        Editing Project: {localState.project}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Passphrase: {localState.passphrase}
      </p>
      <div>
        <button onClick={handleCancel} className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded">
          Cancel
        </button>
        <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
          Save
        </button>
      </div>
    </div>
  );
}
