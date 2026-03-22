import type { FC } from "react";
import { useNavigate } from "react-router-dom";

const PracticeUnavailable: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-white text-3xl flex items-center justify-center">
          🔒
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Practice Mode Is Locked
        </h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Practice mode is not available right now. We are working on
          improvements and it will return in a future update.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PracticeUnavailable;
