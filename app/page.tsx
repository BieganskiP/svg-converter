"use client";

import { useState } from "react";

export default function Home() {
  const [svgCode, setSvgCode] = useState("");
  const [componentName, setComponentName] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [inputMethod, setInputMethod] = useState<"code" | "file">("code");
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSvgCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const convertSvgToReact = () => {
    if (!svgCode || !componentName) return;

    // Basic transformations
    const converted = svgCode
      // Convert kebab-case to camelCase
      .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      // Replace color values with currentColor, but preserve fill="none"
      .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
      .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      // Make width and height 100%
      .replace(/width="[^"]*"/g, 'width="100%"')
      .replace(/height="[^"]*"/g, 'height="100%"')
      // Add className prop
      .replace(/<svg/g, "<svg className={className}");

    // Create the full component code
    const fullComponent = `interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className }: ${componentName}Props) {
  return (
    ${converted}
  );
}`;

    setConvertedCode(fullComponent);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(convertedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        SVG to React Component Converter
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Left side - Input */}
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Component Name:</label>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., DoubleCheck"
            />
          </div>

          <div>
            <label className="block mb-2">Input Method:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="code"
                  checked={inputMethod === "code"}
                  onChange={(e) =>
                    setInputMethod(e.target.value as "code" | "file")
                  }
                  className="mr-2"
                />
                SVG Code
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="file"
                  checked={inputMethod === "file"}
                  onChange={(e) =>
                    setInputMethod(e.target.value as "code" | "file")
                  }
                  className="mr-2"
                />
                SVG File
              </label>
            </div>
          </div>

          {inputMethod === "code" ? (
            <div>
              <label className="block mb-2">SVG Code:</label>
              <textarea
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                className="w-full h-[calc(100vh-300px)] p-2 border rounded font-mono"
                placeholder="Paste your SVG code here..."
              />
            </div>
          ) : (
            <div>
              <label className="block mb-2">SVG File:</label>
              <input
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                className="w-full p-2 border rounded"
              />
              {svgCode && (
                <div className="mt-2">
                  <label className="block mb-2">File Preview:</label>
                  <pre className="w-full h-48 p-2 border rounded font-mono overflow-auto">
                    {svgCode}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            onClick={convertSvgToReact}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sticky bottom-4"
          >
            Convert
          </button>
        </div>

        {/* Right side - Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block">Converted Component:</label>
            {convertedCode && (
              <button
                onClick={handleCopy}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre className="w-full h-[calc(100vh-300px)] p-4 bg-gray-100 rounded overflow-auto font-mono">
            {convertedCode || "Converted code will appear here..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
