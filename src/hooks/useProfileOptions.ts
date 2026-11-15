import { useEffect, useState } from 'react';
import * as profileOptionsApi from '../api/profileOptionsApi';
import { OptionGroup, ProfileOptions } from '../api/profileOptionsApi';

const NO_OPTIONS: ProfileOptions = { skillGroups: [], languageGroups: [], availabilityGroups: [] };

// The options are loaded from the backend once, then shared by every screen that needs them.
// (A module-level variable lives for as long as the app is open.)
let cachedRequest: Promise<ProfileOptions> | null = null;

export function loadProfileOptions(): Promise<ProfileOptions> {
  if (!cachedRequest) {
    cachedRequest = profileOptionsApi.getProfileOptions().catch((error) => {
      cachedRequest = null; // didn't work, so ask again next time
      throw error;
    });
  }
  return cachedRequest;
}

// For screens: starts empty, then fills in once the options have loaded (instantly after the first time)
export function useProfileOptions(): ProfileOptions {
  const [options, setOptions] = useState<ProfileOptions>(NO_OPTIONS);

  useEffect(() => {
    let stillOpen = true; // don't update a screen that's already been closed
    loadProfileOptions()
      .then((loaded) => {
        if (stillOpen) setOptions(loaded);
      })
      .catch(() => {
        // Non-critical: the pickers stay empty, and the next screen to open tries again
      });
    return () => {
      stillOpen = false;
    };
  }, []);

  return options;
}

// Every option in a set of groups, as one flat list
export function allOptions(groups: OptionGroup[]): string[] {
  return groups.flatMap((group) => group.options);
}