import { useEffect, useState } from 'react';
import { Screen, ExtraSummary, ExtraProfileDetail, Tally } from '../types';
import { errorMessage } from '../api/client';
import * as profilesApi from '../api/profilesApi';
import * as invitesApi from '../api/invitesApi';
import * as requestsApi from '../api/requestsApi';

const PAGE_SIZE = 10; // extras per page

// Coordinators: the Extra Profiles list with its search and filters,
// plus one opened extra (their profile, activity numbers and the menu actions).
export function useExtras(screen: Screen) {
  // ----- The list + filters -----
  const [extras, setExtras] = useState<ExtraSummary[]>([]); // just the current page
  const [extrasPage, setExtrasPage] = useState(1);
  const [extrasTotal, setExtrasTotal] = useState(0); // how many match, across all pages
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasMessage, setExtrasMessage] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
  const [minAgeFilter, setMinAgeFilter] = useState('');
  const [maxAgeFilter, setMaxAgeFilter] = useState('');

  // ----- One opened extra -----
  const [selectedExtraProfile, setSelectedExtraProfile] = useState<ExtraProfileDetail | null>(null);
  const [extraDetailLoading, setExtraDetailLoading] = useState(false);
  const [extraDetailMessage, setExtraDetailMessage] = useState('');
  const [extraTally, setExtraTally] = useState<Tally | null>(null);

  // Asks the server for one page of extras, using the current search and filters
  const loadPage = async (page: number, filters: profilesApi.ExtrasFilters = currentFilters()) => {
    setExtrasLoading(true);
    setExtrasMessage('');
    try {
      const data = await profilesApi.getExtras(filters, page, PAGE_SIZE);
      setExtras(data.extras);
      setExtrasTotal(data.total);
      setExtrasPage(data.page);
    } catch (error) {
      setExtrasMessage(`Could not load extras: ${errorMessage(error)}`);
    } finally {
      setExtrasLoading(false);
    }
  };

  const currentFilters = (): profilesApi.ExtrasFilters => ({
    skills: skillFilter,
    gender: genderFilter,
    availability: availabilityFilter,
    minAge: minAgeFilter,
    maxAge: maxAgeFilter,
    name: nameFilter,
  });

  // A new search or filter always starts from page 1
  const loadExtras = () => loadPage(1);

  // The Pager's Prev / Next
  const goToExtrasPage = (page: number) => loadPage(page);

  // Load on Extra Profiles, and again whenever the search or a filter changes.
  // (Age only reloads when "Apply Age Filter" is tapped, so typing doesn't search each digit.)
  useEffect(() => {
    if (screen === 'extrasList') {
      loadExtras();
    }
  }, [screen, nameFilter, skillFilter, genderFilter, availabilityFilter]);

  // Going back to Home starts the search and filters fresh for next time.
  // (Opening an extra's profile and pressing Back keeps them, which is handy mid-search.)
  useEffect(() => {
    if (screen === 'home') {
      resetExtras();
    }
  }, [screen]);

  const toggleSkillFilter = (skill: string) => {
    setSkillFilter((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const toggleAvailabilityFilter = (day: string) => {
    setAvailabilityFilter((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const clearFilters = async () => {
    setSkillFilter([]);
    setGenderFilter('');
    setAvailabilityFilter([]);
    setMinAgeFilter('');
    setMaxAgeFilter('');
    // The filters above only change on the next render, so ask with "no filters" directly
    // (the name search stays, like before)
    await loadPage(1, { name: nameFilter });
  };

  // On log out: forget the last user's search, filters and list,
  // so the next person to log in on this phone starts fresh
  const resetExtras = () => {
    setNameFilter('');
    setSkillFilter([]);
    setGenderFilter('');
    setAvailabilityFilter([]);
    setMinAgeFilter('');
    setMaxAgeFilter('');
    setExtras([]);
    setExtrasPage(1);
    setExtrasTotal(0);
  };

  const loadExtraProfile = async (id: string) => {
    setExtraDetailLoading(true);
    setExtraDetailMessage('');
    setSelectedExtraProfile(null);
    try {
      setSelectedExtraProfile(await profilesApi.getExtraProfile(id));
    } catch (error) {
      setExtraDetailMessage(`Could not load profile: ${errorMessage(error)}`);
    } finally {
      setExtraDetailLoading(false);
    }
  };

  const loadExtraTally = async (extraProfileId: string) => {
    setExtraTally(null);
    try {
      setExtraTally(await invitesApi.getExtraTally(extraProfileId));
    } catch (error) {
      // Non-critical — the admin screen just doesn't show the activity widget if this fails.
    }
  };

  // Opening one extra loads their profile and their activity numbers
  const openExtra = (id: string) => {
    loadExtraProfile(id);
    loadExtraTally(id);
  };

  // Hamburger menu → Request Account Deletion
  const requestDeletionForExtra = async (userId: string) => {
    try {
      await requestsApi.requestDeletionForExtra(userId);
      if (selectedExtraProfile) {
        loadExtraProfile(selectedExtraProfile.id); // shows the "deletion requested" banner
      }
    } catch (error) {
      setExtraDetailMessage(`Could not request deletion: ${errorMessage(error)}`);
    }
  };

  // Hamburger menu → Remove from Production. Returns true if it worked, so App can go back.
  const removeFromMyProduction = async (extraProfileId: string): Promise<boolean> => {
    setExtraDetailMessage('');
    try {
      await profilesApi.removeExtraFromMyProduction(extraProfileId);
      return true;
    } catch (error) {
      // e.g. "This is the extra's only production. Use a deletion request instead."
      setExtraDetailMessage(errorMessage(error));
      return false;
    }
  };

  return {
    extras,
    extrasPage,
    extrasTotal,
    extrasPageSize: PAGE_SIZE,
    goToExtrasPage,
    extrasLoading,
    extrasMessage,
    nameFilter,
    setNameFilter,
    skillFilter,
    setSkillFilter,
    toggleSkillFilter,
    genderFilter,
    setGenderFilter,
    availabilityFilter,
    setAvailabilityFilter,
    toggleAvailabilityFilter,
    minAgeFilter,
    setMinAgeFilter,
    maxAgeFilter,
    setMaxAgeFilter,
    loadExtras,
    clearFilters,
    resetExtras,
    selectedExtraProfile,
    extraDetailLoading,
    extraDetailMessage,
    extraTally,
    openExtra,
    requestDeletionForExtra,
    removeFromMyProduction,
  };
}