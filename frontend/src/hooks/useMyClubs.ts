import { useState, useCallback, useEffect } from 'react';
import { getMyGroups, MyGroup, SubgroupBrief } from '../services/clubs';

export interface ClubItem {
  id: string;
  name: string;
  logo_image: string | null;
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

  return { clubs, isLoading, refresh };
}
