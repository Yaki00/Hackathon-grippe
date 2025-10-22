import { useState, useEffect, useCallback, useMemo } from "react";
import { filterManager } from "../services/FilterManager";
import type { FilterData, FilterState } from "../types/filters";

export interface UseFiltersReturn {
  filterState: FilterState;
  filterData: FilterData;
  updateFilter: (key: keyof FilterState, value: any) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function useFilters(
  initialState?: Partial<FilterState>
): UseFiltersReturn {
  const [filterState, setFilterState] = useState<FilterState>({
    selectedFilter: "none",
    selectedRegion: "all",
    selectedYear: "2024",
    volumeMode: false,
    ...initialState,
  });

  const [filterData, setFilterData] = useState<FilterData>({
    filterId: "none",
    data: {},
    loading: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Fonction pour mettre à jour l'état des filtres
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilterState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Fonction pour récupérer les données selon le filtre sélectionné
  const fetchFilterData = useCallback(async () => {
    const { selectedFilter, selectedYear } = filterState;

    if (selectedFilter === "none") {
      setFilterData({
        filterId: "none",
        data: {},
        loading: false,
      });
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const data = await filterManager.fetchData(selectedYear, selectedFilter);
      const filteredData = filterManager.getFilteredData(
        data,
        filterState.selectedRegion
      );

      setFilterData({
        filterId: selectedFilter,
        data: filteredData,
        loading: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      setFilterData({
        filterId: selectedFilter,
        data: {},
        loading: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    filterState.selectedFilter,
    filterState.selectedYear,
    filterState.selectedRegion,
  ]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    await fetchFilterData();
  }, [fetchFilterData]);

  // Effet pour charger les données quand les filtres changent
  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Données filtrées par région
  const filteredDataByRegion = useMemo(() => {
    if (filterState.selectedRegion === "all") {
      return filterData.data;
    }

    return filterManager.getFilteredData(
      filterData.data,
      filterState.selectedRegion
    );
  }, [filterData.data, filterState.selectedRegion]);

  return {
    filterState,
    filterData: {
      ...filterData,
      data: filteredDataByRegion,
    },
    updateFilter,
    refreshData,
    isLoading,
    error,
  };
}

// Hook spécialisé pour les données de département
export function useDepartmentData(
  departmentCode: string,
  filterData: FilterData
) {
  return useMemo(() => {
    return filterData.data[departmentCode] || null;
  }, [departmentCode, filterData.data]);
}

// Hook pour obtenir la configuration d'un filtre
export function useFilterConfig(filterId: string) {
  return useMemo(() => {
    return filterManager.getFilterConfig(filterId);
  }, [filterId]);
}

// Hook pour obtenir les options de filtres disponibles
export function useAvailableFilters() {
  return useMemo(() => {
    return filterManager.getAvailableFilters();
  }, []);
}
