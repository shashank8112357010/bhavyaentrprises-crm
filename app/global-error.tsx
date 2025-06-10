"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-gray-300">500</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 mb-8">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
