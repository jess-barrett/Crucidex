"use client";

import { useState } from "react";
import type { PlayStatus } from "@/lib/types";

export type SortOption =
  | "title-asc"
  | "title-desc"
  | "hours-desc"
  | "hours-asc"
  | "rating-desc"
  | "igdb-rating-desc"
  | "recent";

export type HoursFilter = "all" | "0-10" | "10-50" | "50-100" | "100+";
export type ModeFilter = "all" | "single" | "multi";
export type PlayStatusFilter = "all" | PlayStatus;

interface Genre {
  id: number;
  name: string;
}

interface LibraryControlsProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  hoursFilter: HoursFilter;
  onHoursFilterChange: (filter: HoursFilter) => void;
  genreFilter: number | null;
  onGenreFilterChange: (genreId: number | null) => void;
  modeFilter: ModeFilter;
  onModeFilterChange: (filter: ModeFilter) => void;
  playStatusFilter: PlayStatusFilter;
  onPlayStatusFilterChange: (filter: PlayStatusFilter) => void;
  availableGenres: Genre[];
}

export default function LibraryControls({
  sortOption,
  onSortChange,
  hoursFilter,
  onHoursFilterChange,
  genreFilter,
  onGenreFilterChange,
  modeFilter,
  onModeFilterChange,
  playStatusFilter,
  onPlayStatusFilterChange,
  availableGenres,
}: LibraryControlsProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    hoursFilter !== "all" ||
    genreFilter !== null ||
    modeFilter !== "all" ||
    playStatusFilter !== "all";
  const activeFilterCount = [
    hoursFilter !== "all",
    genreFilter !== null,
    modeFilter !== "all",
    playStatusFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Sort and Filter Toggle Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="border border-gray-600 rounded px-3 py-2 text-sm bg-gray-800 text-white"
        >
          <option value="title-asc">Title (A-Z)</option>
          <option value="title-desc">Title (Z-A)</option>
          <option value="hours-desc">Most Played</option>
          <option value="hours-asc">Least Played</option>
          <option value="rating-desc">My Rating</option>
          <option value="igdb-rating-desc">Public Rating</option>
          <option value="recent">Recently Played</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border rounded text-sm flex items-center gap-2 transition-colors ${
            hasActiveFilters
              ? "bg-[#b8253d]/20 border-[#b8253d] text-white"
              : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-[#b8253d] text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => {
              onHoursFilterChange("all");
              onGenreFilterChange(null);
              onModeFilterChange("all");
              onPlayStatusFilterChange("all");
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="border border-gray-700 rounded p-4 bg-gray-800 space-y-4">
          {/* Hours Played Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hours Played
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "0-10", label: "0-10 hrs" },
                { value: "10-50", label: "10-50 hrs" },
                { value: "50-100", label: "50-100 hrs" },
                { value: "100+", label: "100+ hrs" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onHoursFilterChange(option.value as HoursFilter)
                  }
                  className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors ${
                    hoursFilter === option.value
                      ? "bg-[#b8253d] text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                value={genreFilter ?? ""}
                onChange={(e) =>
                  onGenreFilterChange(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="border border-gray-600 rounded px-3 py-2 text-sm bg-gray-700 text-white w-full max-w-xs"
              >
                <option value="">All Genres</option>
                {availableGenres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Game Mode Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Game Mode
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "single", label: "Single Player" },
                { value: "multi", label: "Multiplayer" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => onModeFilterChange(option.value as ModeFilter)}
                  className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors ${
                    modeFilter === option.value
                      ? "bg-[#b8253d] text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Play Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Play Status
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "playing", label: "Playing" },
                { value: "completed", label: "Completed" },
                { value: "played", label: "Played" },
                { value: "backlog", label: "Backlog" },
                { value: "wishlist", label: "Wishlist" },
                { value: "shelved", label: "Shelved" },
                { value: "retired", label: "Retired" },
                { value: "abandoned", label: "Abandoned" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onPlayStatusFilterChange(option.value as PlayStatusFilter)
                  }
                  className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors ${
                    playStatusFilter === option.value
                      ? "bg-[#b8253d] text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
