"use client";

import { useState } from "react";

interface ConfirmDeleteModalProps {
  gameName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  gameName,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Delete Game</h2>
        <p className="text-gray-300 mb-6">
          Are you sure you want to remove <strong className="text-white">{gameName}</strong> from your
          library? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded text-gray-300 hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
