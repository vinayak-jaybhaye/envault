import Editor from "@monaco-editor/react";

export default function MonacoEditor({content, onChange}: {content: string, onChange:any}) {
  return (
    <div>
      <Editor
        height="400px"
        defaultLanguage="ini"
        defaultValue={content}
        value={content}
        theme="vs-dark"
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: "on",
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
