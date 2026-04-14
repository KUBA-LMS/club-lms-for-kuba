import { useState, useCallback, useEffect } from 'react';
import { getMyGroups, MyGroup, SubgroupBrief } from '../services/clubs';

export interface ClubItem {
  id: string;
  name: string;
  logo_image: string | null;
  role: string;
  subgroups: SubgroupBrief[];
}

export function useMyClubs() {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const groups: MyGroup[] = await getMyGroups();
      setClubs(
        groups.map((g) => ({
          id: g.id,
          name: g.name,
          logo_image: g.logo_image,
          role: g.role,
          subgroups: g.subgroups,
        })),
      );
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isAdminOfAny = clubs.some((c) => c.role === 'admin' || c.role === 'lead');

  return { clubs, isLoading, refresh, isAdminOfAny };
}
