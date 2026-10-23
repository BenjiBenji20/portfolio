'use client';

import { useState, useMemo } from 'react';
import type { ProjectData } from '@/types/sanity';
import { ProjectFilterBar } from './ProjectFilterBar';
import { ProjectMasonryGrid } from './ProjectMasonryGrid';

interface ProjectsExplorerProps {
  initialProjects: ProjectData[];
}

export function ProjectsExplorer({ initialProjects }: ProjectsExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);

  // Extract unique available filter facets
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    initialProjects.forEach((p) => {
      if (p.projectType?.trim()) {
        types.add(p.projectType.trim());
      }
    });
    return Array.from(types).sort();
  }, [initialProjects]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    initialProjects.forEach((p) => {
      if (p.status?.trim()) {
        statuses.add(p.status.trim());
      }
    });
    return Array.from(statuses).sort();
  }, [initialProjects]);

  const availableStacks = useMemo(() => {
    const stacks = new Set<string>();
    initialProjects.forEach((p) => {
      p.techStacks?.forEach((stack) => {
        if (stack?.trim()) {
          stacks.add(stack.trim());
        }
      });
    });
    return Array.from(stacks).sort();
  }, [initialProjects]);

  // Filter projects by search query and active facets
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      // 1. Text Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = project.title.toLowerCase().includes(q);
        const matchesDesc = project.shortDescription?.toLowerCase().includes(q);
        const matchesType = project.projectType?.toLowerCase().includes(q);
        const matchesEmployer = project.employer?.toLowerCase().includes(q);
        const matchesStack = project.techStacks?.some((stack) =>
          stack.toLowerCase().includes(q)
        );

        if (!matchesTitle && !matchesDesc && !matchesType && !matchesEmployer && !matchesStack) {
          return false;
        }
      }

      // 2. Project Type Filter
      if (selectedType && project.projectType !== selectedType) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus && project.status !== selectedStatus) {
        return false;
      }

      // 4. Tech Stack Filter
      if (selectedStack && !project.techStacks?.includes(selectedStack)) {
        return false;
      }

      return true;
    });
  }, [initialProjects, searchQuery, selectedType, selectedStatus, selectedStack]);

  return (
    <div className="w-full space-y-6">
      {/* Search and Label-Free Icon Filters */}
      <ProjectFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedStack={selectedStack}
        onStackChange={setSelectedStack}
        availableTypes={availableTypes}
        availableStatuses={availableStatuses}
        availableStacks={availableStacks}
        totalResults={filteredProjects.length}
      />

      {/* 2-Column Masonry Grid */}
      <ProjectMasonryGrid
        projects={filteredProjects}
      />
    </div>
  );
}
