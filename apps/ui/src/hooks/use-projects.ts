import { useMemo } from 'react';
import { useApiQuery } from './use-api-query';
import { Project } from '@/projects/entities/Project';

export function useProjects(page = 0, size = 20, filter?: { name?: string; tags?: string[] }) {
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (filter?.name) {
      params.append('name', filter.name);
    }
    if (filter?.tags && filter.tags.length > 0) {
      params.append('tags', filter.tags.join(','));
    }

    return params.toString();
  }, [page, size, filter?.name, filter?.tags]);

  return useApiQuery<{ items?: Project[]; page?: number; total_pages?: number }>({
    url: `/projects?${queryParams}`,
  });
}
