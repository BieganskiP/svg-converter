"use client";

import { useState, useEffect } from "react";

interface ConvertedFile {
  name: string;
  code: string;
  originalName: string;
}

export default function Home() {
  const [svgCode, setSvgCode] = useState("");
  const [componentName, setComponentName] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [inputMethod, setInputMethod] = useState<"code" | "file" | "bulk">(
    "code"
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<ConvertedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check user's system preference for dark mode
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);
  }, []);

  const generateComponentName = (fileName: string) => {
    const nameWithoutExt = fileName.replace(/\.svg$/, "");
    const words = nameWithoutExt.split(/[-_]/);
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  };

  const convertSingleSvg = (svgContent: string, componentName: string) => {
    const converted = svgContent
      .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
      .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
      .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      .replace(/width="[^"]*"/g, 'width="100%"')
      .replace(/height="[^"]*"/g, 'height="100%"')
      .replace(/<svg/g, "<svg className={className}");

    return `interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className }: ${componentName}Props) {
  return (
    ${converted}
  );
}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSvgCode(e.target?.result as string);
        setComponentName(generateComponentName(file.name));
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const convertedFiles: ConvertedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
        try {
          const content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          });

          const componentName = generateComponentName(file.name);
          const convertedCode = convertSingleSvg(content, componentName);

          convertedFiles.push({
            name: componentName,
            code: convertedCode,
            originalName: file.name,
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
        }
      }
    }

    setBulkFiles(convertedFiles);
    setIsProcessing(false);
  };

  const convertSvgToReact = () => {
    if (!svgCode || !componentName) return;
    const fullComponent = convertSingleSvg(svgCode, componentName);
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

  const handleDownload = () => {
    if (!convertedCode || !componentName) return;

    const blob = new Blob([convertedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${componentName}.tsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleBulkDownload = () => {
    if (bulkFiles.length === 0) return;

    bulkFiles.forEach((file) => {
      const blob = new Blob([file.code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name}.tsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    });
  };

  const handleCopyBulkFile = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add individual copy success feedback here
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
            {inputMethod !== "bulk" && (
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
            )}

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
                      setInputMethod(
                        e.target.value as "code" | "file" | "bulk"
                      );
                      setComponentName("");
                      setBulkFiles([]);
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
                      setInputMethod(
                        e.target.value as "code" | "file" | "bulk"
                      );
                      setComponentName("");
                      setBulkFiles([]);
                    }}
                    className={`mr-2 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span
                    className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                  >
                    Single File
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="bulk"
                    checked={inputMethod === "bulk"}
                    onChange={(e) => {
                      setInputMethod(
                        e.target.value as "code" | "file" | "bulk"
                      );
                      setComponentName("");
                      setConvertedCode("");
                    }}
                    className={`mr-2 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span
                    className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                  >
                    Bulk Files
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
            ) : inputMethod === "file" ? (
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
            ) : (
              <div>
                <label
                  className={`block mb-2 ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Upload Multiple SVG Files:
                </label>
                <input
                  type="file"
                  accept=".svg"
                  multiple
                  onChange={handleBulkUpload}
                  className={`w-full p-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
                {isProcessing && (
                  <div
                    className={`mt-2 text-center ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Processing files...
                  </div>
                )}
                {bulkFiles.length > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {bulkFiles.length} files processed
                      </span>
                      <button
                        onClick={handleBulkDownload}
                        className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition-colors text-sm"
                      >
                        Download All
                      </button>
                    </div>
                    <div
                      className={`max-h-48 overflow-auto p-2 rounded-lg border ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {bulkFiles.map((file, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center py-1 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          <span className="text-sm">
                            {file.originalName} → {file.name}.tsx
                          </span>
                          <button
                            onClick={() => handleCopyBulkFile(file.code)}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMethod !== "bulk" && (
              <button
                onClick={convertSvgToReact}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full sticky bottom-4 transition-colors shadow-md hover:shadow-lg"
              >
                Convert
              </button>
            )}
          </div>

          {/* Right side - Output */}
          <div className="space-y-4">
            {inputMethod !== "bulk" ? (
              <>
                <div className="flex justify-between items-center">
                  <label
                    className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                  >
                    Converted Component:
                  </label>
                  {convertedCode && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopy}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                      >
                        {copySuccess ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg"
                      >
                        Download .tsx
                      </button>
                    </div>
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
              </>
            ) : (
              <div>
                <label
                  className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                >
                  Bulk Processing Results:
                </label>
                <div
                  className={`w-full h-[calc(100vh-300px)] p-4 rounded-lg border overflow-auto transition-colors ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  {bulkFiles.length === 0 ? (
                    <div
                      className={`text-center ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Upload multiple SVG files to see the converted components
                      here...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {bulkFiles.map((file, index) => (
                        <div
                          key={index}
                          className={`border-b pb-4 ${
                            isDarkMode ? "border-gray-600" : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3
                              className={`font-semibold ${
                                isDarkMode ? "text-gray-200" : "text-gray-700"
                              }`}
                            >
                              {file.name}.tsx
                            </h3>
                            <button
                              onClick={() => handleCopyBulkFile(file.code)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors text-sm"
                            >
                              Copy
                            </button>
                          </div>
                          <pre
                            className={`text-xs font-mono p-2 rounded ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-100"
                            } overflow-x-auto`}
                          >
                            {file.code}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
