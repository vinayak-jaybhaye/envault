import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MonacoEditor from "../components/MonacoEditor";
import { API_URL } from "../config";
import { useAuth } from "../components/AuthContext";
import { Copy, CopyCheck } from 'lucide-react';


interface EditorState {
  content: string;
  passphrase: string;
  project: string;
}

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
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
    if (loading) return; // Prevent multiple saves
    if (!localState?.passphrase || !localState?.project) {
      alert("Missing project information. Please try again.");
      return;
    }

    if (localState.content === content) {
      navigate(-1); // No changes made
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
      alert("Project saved successfully!");
      navigate(-1); // Navigate back

    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return; // Prevent navigation while loading
    // Navigate back to the previous page
    navigate(-1);
  }

  const handleCopyToClipboard = () => {
    if (copied || content.trim() === "") {
      return;
    }
    navigator.clipboard.writeText(content)
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000); // Reset copied state after 2 seconds
  }

  return (
    <div className="p-2 md:p-6">
      <MonacoEditor
        content={content}
        onChange={handleChange}
      />
      <div className="mt-4">
        <div className="flex items-center mb-4 gap-4">
          <h1 className="text-xl font-semibold">
            Editing Project: {localState.project}
          </h1>
          {/* copy text button */}
          <button onClick={handleCopyToClipboard} className="hover:bg-gray-800 text-gray-800 font-semibold rounded cursor-pointer px-2 py-1">
            {
              copied ? (
                <CopyCheck className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )

            }
          </button>
        </div>
        <div>
          <button disabled={loading} onClick={handleCancel} className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded cursor-pointer">
            Cancel
          </button>
          <button disabled={loading} onClick={handleSave} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded cursor-pointer">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
