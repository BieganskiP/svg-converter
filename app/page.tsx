"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [svgCode, setSvgCode] = useState("");
  const [componentName, setComponentName] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [inputMethod, setInputMethod] = useState<"code" | "file">("code");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check user's system preference for dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);
  }, []);

  const generateComponentName = (fileName: string) => {
    // Remove .svg extension and split by hyphens
    const nameWithoutExt = fileName.replace(/\.svg$/, "");
    const words = nameWithoutExt.split(/[-_]/);

    // Capitalize first letter of each word and join
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSvgCode(e.target?.result as string);
        // Generate component name from file name
        setComponentName(generateComponentName(file.name));
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
    <div
      className={`min-h-screen ${
        isDarkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            SVG to React Component Converter
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-white hover:bg-gray-100 text-gray-800"
            }`}
          >
            {isDarkMode ? "🌞" : "🌙"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left side - Input */}
          <div className="space-y-4">
            <div>
              <label
                className={`block mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Component Name:
              </label>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                className={`w-full p-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="e.g., DoubleCheck"
              />
            </div>

            <div>
              <label
                className={`block mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Input Method:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="code"
                    checked={inputMethod === "code"}
                    onChange={(e) => {
                      setInputMethod(e.target.value as "code" | "file");
                      if (e.target.value === "code") {
                        setComponentName(""); // Clear component name when switching to code input
                      }
                    }}
                    className={`mr-2 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span
                    className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                  >
                    SVG Code
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="file"
                    checked={inputMethod === "file"}
                    onChange={(e) => {
                      setInputMethod(e.target.value as "code" | "file");
                      if (e.target.value === "file") {
                        setComponentName(""); // Clear component name when switching to file input
                      }
                    }}
                    className={`mr-2 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span
                    className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                  >
                    SVG File
                  </span>
                </label>
              </div>
            </div>

            {inputMethod === "code" ? (
              <div>
                <label
                  className={`block mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  SVG Code:
                </label>
                <textarea
                  value={svgCode}
                  onChange={(e) => setSvgCode(e.target.value)}
                  className={`w-full h-[calc(100vh-300px)] p-2 rounded-lg border font-mono transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Paste your SVG code here..."
                />
              </div>
            ) : (
              <div>
                <label
                  className={`block mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  SVG File:
                </label>
                <input
                  type="file"
                  accept=".svg"
                  onChange={handleFileUpload}
                  className={`w-full p-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
                {svgCode && (
                  <div className="mt-2">
                    <label
                      className={`block mb-2 ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      File Preview:
                    </label>
                    <pre
                      className={`w-full h-48 p-2 rounded-lg border font-mono overflow-auto transition-colors ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      {svgCode}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={convertSvgToReact}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full sticky bottom-4 transition-colors shadow-md hover:shadow-lg"
            >
              Convert
            </button>
          </div>

          {/* Right side - Output */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                Converted Component:
              </label>
              {convertedCode && (
                <button
                  onClick={handleCopy}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <pre
              className={`w-full h-[calc(100vh-300px)] p-4 rounded-lg border font-mono overflow-auto transition-colors ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              {convertedCode || "Converted code will appear here..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
