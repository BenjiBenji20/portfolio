'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiChevronDown, FiCheck } from 'react-icons/fi';

interface ProjectFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  selectedStack: string | null;
  onStackChange: (stack: string | null) => void;
  availableTypes: string[];
  availableStatuses: string[];
  availableStacks: string[];
  totalResults: number;
}

export function ProjectFilterBar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  selectedStack,
  onStackChange,
  availableTypes,
  availableStatuses,
  availableStacks,
  totalResults,
}: ProjectFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<'type' | 'status' | 'stack' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedType || selectedStatus || selectedStack
  );

  return (
    <div ref={containerRef} className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        {/* Search Bar Input with Reduced Width */}
        <div className="relative w-full sm:w-64 md:w-72 shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects..."
            className="w-full h-9 pl-8 pr-7 text-xs font-sans text-zinc-100 placeholder:text-zinc-500 bg-zinc-900/60 border border-zinc-800/80 rounded-none focus:outline-none focus:border-sky-500/80 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Clear search"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
            >
              <FiX className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Labeled Dropdown Filter Buttons with Chevron Icon */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* 1. Type Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              title="Filter by Type"
              aria-label="Filter by Type"
              className={`h-9 px-3 text-xs font-medium rounded-none border transition-colors inline-flex items-center gap-1.5 ${
                selectedType
                  ? 'bg-sky-950/50 border-sky-500 text-sky-400'
                  : openDropdown === 'type'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
              }`}
            >
              <span>{selectedType ? `Type: ${selectedType}` : 'Type'}</span>
              <FiChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  openDropdown === 'type' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Type Dropdown Popover */}
            {openDropdown === 'type' && (
              <div className="absolute left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-none shadow-xl z-30 py-1 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onTypeChange(null);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                    !selectedType
                      ? 'text-sky-400 font-semibold bg-zinc-800/50'
                      : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <span>All Types</span>
                  {!selectedType && <FiCheck className="w-3.5 h-3.5" />}
                </button>
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onTypeChange(type === selectedType ? null : type);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                      selectedType === type
                        ? 'text-sky-400 font-semibold bg-zinc-800/50'
                        : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="truncate">{type}</span>
                    {selectedType === type && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Status Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              title="Filter by Status"
              aria-label="Filter by Status"
              className={`h-9 px-3 text-xs font-medium rounded-none border transition-colors inline-flex items-center gap-1.5 ${
                selectedStatus
                  ? 'bg-sky-950/50 border-sky-500 text-sky-400'
                  : openDropdown === 'status'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
              }`}
            >
              <span className="capitalize">
                {selectedStatus ? `Status: ${selectedStatus}` : 'Status'}
              </span>
              <FiChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  openDropdown === 'status' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Status Dropdown Popover */}
            {openDropdown === 'status' && (
              <div className="absolute left-0 mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-none shadow-xl z-30 py-1">
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(null);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                    !selectedStatus
                      ? 'text-sky-400 font-semibold bg-zinc-800/50'
                      : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <span>All Statuses</span>
                  {!selectedStatus && <FiCheck className="w-3.5 h-3.5" />}
                </button>
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onStatusChange(status === selectedStatus ? null : status);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs capitalize flex items-center justify-between transition-colors ${
                      selectedStatus === status
                        ? 'text-sky-400 font-semibold bg-zinc-800/50'
                        : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <span>{status}</span>
                    {selectedStatus === status && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Stack Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'stack' ? null : 'stack')}
              title="Filter by Tech Stack"
              aria-label="Filter by Tech Stack"
              className={`h-9 px-3 text-xs font-medium rounded-none border transition-colors inline-flex items-center gap-1.5 ${
                selectedStack
                  ? 'bg-sky-950/50 border-sky-500 text-sky-400'
                  : openDropdown === 'stack'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
              }`}
            >
              <span>{selectedStack ? `Stack: ${selectedStack}` : 'Stack'}</span>
              <FiChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  openDropdown === 'stack' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Stack Dropdown Popover */}
            {openDropdown === 'stack' && (
              <div className="absolute left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-none shadow-xl z-30 py-1 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onStackChange(null);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                    !selectedStack
                      ? 'text-sky-400 font-semibold bg-zinc-800/50'
                      : 'text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <span>All Tech Stacks</span>
                  {!selectedStack && <FiCheck className="w-3.5 h-3.5" />}
                </button>
                {availableStacks.map((stack) => (
                  <button
                    key={stack}
                    type="button"
                    onClick={() => {
                      onStackChange(stack === selectedStack ? null : stack);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                      selectedStack === stack
                        ? 'text-sky-400 font-semibold bg-zinc-800/50'
                        : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="truncate">{stack}</span>
                    {selectedStack === stack && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Badges Row (if any filter is selected) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-zinc-500">
            {totalResults} {totalResults === 1 ? 'project' : 'projects'} found:
          </span>
          {selectedType && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-none bg-sky-950/60 text-sky-400 border border-sky-800/60">
              Type: {selectedType}
              <button
                type="button"
                onClick={() => onTypeChange(null)}
                className="hover:text-white"
                title="Remove type filter"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStatus && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-none bg-sky-950/60 text-sky-400 border border-sky-800/60 capitalize">
              Status: {selectedStatus}
              <button
                type="button"
                onClick={() => onStatusChange(null)}
                className="hover:text-white"
                title="Remove status filter"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStack && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-none bg-sky-950/60 text-sky-400 border border-sky-800/60">
              Stack: {selectedStack}
              <button
                type="button"
                onClick={() => onStackChange(null)}
                className="hover:text-white"
                title="Remove stack filter"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
