import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { useAuth } from "../components/AuthContext";
import NewProject from "../components/NewProject";

interface Project {
    name: string;
    url?: string;
    description?: string;
    environments?: string[];
    lastModified?: string;
}

export default function Home() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [passphrase, setPassphrase] = useState("");
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const { isAuthenticated, setIsAuthenticated, authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && isAuthenticated === false) {
            navigate("/login");
        }
    }, [authLoading, isAuthenticated]);

    const [pendingAction, setPendingAction] = useState<null | {
        name: string;
        type: "download" | "edit" | "delete";
    }>(null);


    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${API_URL}/projects`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });
                if (!response.ok) throw new Error("Failed to fetch projects");
                const data = await response.json();
                setProjects(data);
                console.log("Fetched projects:", data);
                setProjects((prev) => prev.slice(1));

            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    if (!isAuthenticated) return null;
    const requestAction = (name: string, type: "download" | "edit" | "delete") => {
        setPendingAction({ name, type });
    };

    const downloadProject = async (name: string, passphrase: string) => {
        try {
            const formData = new FormData();
            formData.append("project_name", name);
            formData.append("passphrase", passphrase);
            console.log(formData);

            const response = await fetch(`${API_URL}/download`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to download");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${name}.env`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Download failed");
            console.error(error);
        }
    };

    const deleteProject = async (name: string, passphrase: string) => {
        try {
            const formData = new FormData();
            formData.append("project_name", name);
            formData.append("passphrase", passphrase);

            const token = localStorage.getItem("token"); // or wherever your token is stored

            const response = await fetch(`${API_URL}/delete`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                credentials: "include", // Include cookies if needed
                body: formData,
            });

            if (!response.ok) throw new Error("Delete failed");

            setProjects((prev) => prev.filter((p) => p.name !== name));
        } catch (error) {
            alert("Delete failed");
            console.error(error);
        }
    };


    const handlePassphraseSubmit = async () => {
        if (!passphrase.trim() || !pendingAction) return;

        const { name, type } = pendingAction;

        if (type === "download") await downloadProject(name, passphrase);
        if (type === "edit") await EditProject(name, passphrase);
        if (type === "delete") await deleteProject(name, passphrase);

        setPendingAction(null);
        setPassphrase("");
    };

    const EditProject = async (project: string, passphrase: string) => {
        try {
            const formData = new FormData();
            formData.append("project_name", project);
            formData.append("passphrase", passphrase);

            const response = await fetch(`${API_URL}/download-data`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Edit failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Edit data:", data.data);
            // ✅ Now you have the actual data
            navigate("/editor", { state: { content: data.data, passphrase, project } });
        } catch (error) {
            alert("Edit failed");
            console.error(error);
        }
    };

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                credentials: "include", // Include cookies if needed
            });
            if (!response.ok) throw new Error("Logout failed");
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Error during logout:", error);

        }
    }

    const handleCreateProject = async () => {
        try {
            const response = await fetch(`${API_URL}/passphrase-exists`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                credentials: "include", // Include cookies if needed
            });
            if (!response.ok) throw new Error("Failed to check passphrase");
            const data = await response.json();
            if (!data.exists) {
                alert("Please create a passphrase first in settings.");
                return;
            }
            setShowNewProjectModal(true);
        } catch (err) {
            console.error("Passphrase check failed:", err);
            return;
        }
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">EnVault</h1>
                            <p className="text-gray-600 mt-1 hidden md:block">Manage your environment variables</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateProject}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                + New Project
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Logout
                            </button>
                            <button
                                onClick={() => navigate("/settings")}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <div className="absolute left-3 top-2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6M5 11a6 6 0 1112 0 6 6 0 01-12 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    {loading ? (
                        <div className="animate-pulse grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                            ))}
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProjects.map((project, index) => (
                                <div key={index} className="bg-white rounded-lg border p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold">{project.name}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => requestAction(project.name, "download")} className="text-sm text-blue-600 hover:underline">
                                                Download
                                            </button>
                                            <button onClick={() => requestAction(project.name, "edit")} className="text-sm text-green-600 hover:underline">
                                                Edit
                                            </button>
                                            <button onClick={() => requestAction(project.name, "delete")} className="text-sm text-red-600 hover:underline">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    {project.description && (
                                        <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                                    )}
                                    <div className="text-xs text-gray-500 flex justify-between">
                                        {project.lastModified && <span>{project.lastModified}</span>}
                                        {project.url && (
                                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                GitHub
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-semibold text-gray-800">No projects found</h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? "No projects match your search."
                                    : "Start by creating your first project."}
                            </p>
                            <button
                                onClick={handleCreateProject}
                                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                            >
                                + Create Project
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Passphrase Modal */}
            {pendingAction && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900">
                            Enter Passphrase to {pendingAction.type} "{pendingAction.name}"
                        </h2>
                        <input
                            type="password"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder="Passphrase"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setPendingAction(null);
                                    setPassphrase("");
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePassphraseSubmit}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {
                showNewProjectModal && (
                    <NewProject
                        onClose={() => setShowNewProjectModal(false)}
                    // onProjectCreated={(project) => {
                    //     setProjects((prev) => [...prev, project]);
                    //     setShowNewProjectModal(false);
                    // }}
                    />
                )
            }
        </>
    );
}
