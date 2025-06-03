import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

type ProjectContextType = {
  projectId: number;
  setProjectId: (id: number) => void;
  currentProject: Project | undefined;
  isLoading: boolean;
  projects: Project[];
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<number>(1);
  
  // Fetch available projects
  const { 
    data: projects = [], 
    isLoading
  } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: false,
  });

  // Set default project when projects load
  useEffect(() => {
    if (projects.length > 0 && projectId === 1) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  // Enhanced setProjectId with cache invalidation
  const handleSetProjectId = (id: number) => {
    setProjectId(id);
    
    // Invalidate all project-specific data when switching projects
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && 
               typeof queryKey[0] === 'string' && 
               queryKey[0].startsWith('/api/projects/');
      },
    });
    
    // Also invalidate common project data queries
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  };

  // Find current project
  const currentProject = projects.find(p => p.id === projectId);

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        setProjectId: handleSetProjectId,
        currentProject,
        isLoading,
        projects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}