import type { TestCase } from "../types/game";

export interface TestResult {
  label: string;
  passed: boolean;
  actual: string;
  expected: string;
  error: string | null;
}

export interface RunResult {
  results: TestResult[];
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
}

// Pyodide singleton — loaded lazily
let pyodideInstance: Awaited<ReturnType<typeof loadPyodide>> | null = null;
let loadingPromise: Promise<void> | null = null;

// Declare loadPyodide from the global script
declare function loadPyodide(): Promise<{
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { get: (key: string) => unknown };
}>;

type PyodideInstance = Awaited<ReturnType<typeof loadPyodide>>;

/**
 * Loads the Pyodide runtime. Call early to warm the cache.
 */
export async function initPyodide(): Promise<void> {
  if (pyodideInstance) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Dynamically load pyodide from CDN if not already present
    if (typeof globalThis.loadPyodide === "undefined") {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
    }

    pyodideInstance = await loadPyodide();
  })();

  return loadingPromise;
}

/**
 * Runs Python code against a set of test cases using Pyodide.
 */
export async function runTests(
  code: string,
  testCases: TestCase[],
  functionName: string
): Promise<RunResult> {
  if (!pyodideInstance) {
    await initPyodide();
  }

  const pyodide = pyodideInstance as PyodideInstance;
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    try {
      // Build the test script
      const testScript = `
${code}

__result__ = repr(${functionName}(${testCase.input}))
__result__
`;
      const actual = String(await pyodide.runPythonAsync(testScript));
      const passed = actual.trim() === testCase.expectedOutput.trim();

      results.push({
        label: testCase.label,
        passed,
        actual: actual.trim(),
        expected: testCase.expectedOutput.trim(),
        error: null,
      });
    } catch (err) {
      results.push({
        label: testCase.label,
        passed: false,
        actual: "",
        expected: testCase.expectedOutput.trim(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    results,
    allPassed: passedTests === results.length,
    totalTests: results.length,
    passedTests,
  };
}

/**
 * Extracts the main function name from Python code.
 * Looks for `def function_name(` pattern.
 */
export function extractFunctionName(code: string): string | null {
  const match = code.match(/def\s+(\w+)\s*\(/);
  return match ? match[1] : null;
}
