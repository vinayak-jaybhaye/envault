import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function NewProject({ onClose }: { onClose: () => void }) {
    const [projectName, setProjectName] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [method, setMethod] = useState('generate');  // upload , generate
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleCreateProject = async () => {
        setError('');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("passphrase", passphrase);
            formData.append("project_name", projectName);

            const response = await fetch(`${API_URL}/verify-project`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to verify passphrase');
                return;
            }

            if (method === 'generate') {
                navigate('/editor', {
                    state: {
                        project: projectName,
                        passphrase,
                        content: "Type env variables here...",
                    }
                });
                return;
            }

            // For 'upload' method
            if (!file) {
                setError('Please select a file to upload.');
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10 MB limit
                setError('File size exceeds the 10 MB limit.');
                return;
            }

            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("project_name", projectName);
            uploadData.append("passphrase", passphrase);

            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: uploadData,
                credentials: 'include',
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                setError(errorData.error || 'Failed to upload file');
                return;
            }

            // Success
            onClose();

        } catch (error) {
            console.error("Error:", error);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false); // Always turn off loading at the end
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-gray-600 p-6 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">Project Details</h1>
                <input
                    type="text"
                    placeholder="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                />
                <input
                    type="password"
                    placeholder="Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded"
                />
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded cursor-pointer"
                >
                    <option value="generate">Generate</option>
                    <option value="upload">Upload</option>
                </select>
                {method === 'upload' && (
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full p-2 mb-4 border border-gray-300 rounded cursor-pointer"
                        accept='.env, .txt, .json, .yaml, .yml, .env.local, .env.production, .env.development, .env.test'
                    />
                )}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    onClick={handleCreateProject}
                    className={`w-full p-2 bg-blue-500 text-white rounded cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="w-full p-2 mt-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default NewProject
