/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { History, Play, Trash2, Download, Clock, Star, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AudioTake } from "../types";
import { downloadWavFile, formatTime } from "../utils/audio";

interface TakesHistoryProps {
  takes: AudioTake[];
  activeTakeId: string | null;
  onSelectTake: (take: AudioTake) => void;
  onDeleteTake: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  activeTakeId,
  onSelectTake,
  onDeleteTake,
  onToggleFavorite,
  onClearHistory,
}) => {
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (takes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs max-w-lg mx-auto space-y-4 my-8">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <History className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">No Audio Takes Yet</h3>
          <p className="text-xs text-slate-500">
            When you generate voice clips in the Studio or Bulk Audio, your saved audio files will appear here for playback and download.
          </p>
        </div>
      </div>
    );
  }

  const filteredTakes = takes.filter((take) => {
    if (filterFavorites && !take.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        take.text.toLowerCase().includes(q) ||
        take.voice.toLowerCase().includes(q) ||
        take.style.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      id="takes-history-panel"
      className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xs">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Voice Takes Archive ({takes.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Instant replay, DSP re-mastering, and WAV export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite filter toggle */}
          <motion.button
            type="button"
            id="filter-favorites-btn"
            onClick={() => setFilterFavorites(!filterFavorites)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
              filterFavorites
                ? "bg-amber-50 text-amber-900 border-amber-300 shadow-2xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Star className={`h-3 w-3 ${filterFavorites ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>Favorites</span>
          </motion.button>

          <motion.button
            type="button"
            id="clear-all-takes-btn"
            onClick={onClearHistory}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </motion.button>
        </div>
      </div>

      {/* Search Bar if takes >= 3 */}
      {takes.length >= 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search takes by script or voice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
      )}

      {/* List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredTakes.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4 italic">
            No matching voice takes found
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {filteredTakes.map((take) => {
              const isActive = take.id === activeTakeId;
              const timeString = new Date(take.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <motion.div
                  key={take.id}
                  id={`history-take-${take.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    isActive
                      ? "border-blue-500 bg-gradient-to-r from-blue-50/90 to-indigo-50/50 shadow-xs ring-1 ring-blue-400"
                      : "border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-2xs"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectTake(take)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-2xs ${
                        isActive
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/25"
                          : "bg-slate-200 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition"
                      }`}
                    >
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </motion.div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {take.voice}
                        </span>
                        <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded font-medium capitalize">
                          {take.style}
                        </span>
                        {take.language && (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-bold uppercase">
                            {take.language}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 ml-auto sm:ml-0">
                          <Clock className="h-2.5 w-2.5" />
                          {take.duration ? formatTime(take.duration) : "—"} &bull; {timeString}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-1">
                        "{take.text}"
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button
                      type="button"
                      onClick={() => onToggleFavorite(take.id)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        take.isFavorite
                          ? "text-amber-500 hover:text-amber-600 bg-amber-50/50"
                          : "text-slate-300 hover:text-amber-400 opacity-70 group-hover:opacity-100"
                      }`}
                      title={take.isFavorite ? "Remove favorite" : "Add to favorites"}
                    >
                      <Star className={`h-3.5 w-3.5 ${take.isFavorite ? "fill-amber-500" : ""}`} />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => downloadWavFile(take.audioUrl, `take_${take.id}.wav`)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Download WAV"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => onDeleteTake(take.id)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Delete take"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
