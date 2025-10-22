import React, { useState, useCallback } from "react";
import { Card, Select, Layout, Switch } from "antd";
import MapTest from "../Maps";
import { REGIONS, DEPARTEMENTS } from "../../data/regions-list";
import { AVAILABLE_YEARS } from "../../../data/constants";
import DepartmentPanel from "./DepartmentPanel";
import Legend from "./Legend";
import {
  useFilters,
  useAvailableFilters,
  useFilterConfig,
} from "../../../hooks/useFilters";
import type {
  HoveredDepartment,
  SelectedDepartment,
} from "../../../types/vaccination";
import type { FilterValue } from "../../../types/filters";

const { Content, Sider } = Layout;

export default function ContentMap() {
  // Utilisation du hook modulaire pour les filtres
  const { filterState, filterData, updateFilter, isLoading } = useFilters();

  const availableFilters = useAvailableFilters();
  const filterConfig = useFilterConfig(filterState.selectedFilter);

  // États locaux pour l'interface
  const [selectedDepartment, setSelectedDepartment] =
    useState<SelectedDepartment | null>(null);
  const [hoveredDepartment, setHoveredDepartment] =
    useState<HoveredDepartment | null>(null);
  const [departmentData, setDepartmentData] = useState<FilterValue | null>(
    null
  );

  // Handlers
  const handleRegionChange = (value: string) => {
    updateFilter("selectedRegion", value);
    setSelectedDepartment(null);
  };

  const findRegionByDepartment = (departmentCode: string): string | null => {
    const department = DEPARTEMENTS.find((dep) => dep.value === departmentCode);
    return department ? department.region : null;
  };

  // Handlers pour les interactions avec les départements

  const handleDepartmentHover = useCallback(
    (
      departmentCode: string,
      departmentName: string,
      event: { x: number; y: number }
    ) => {
      if (
        filterState.selectedRegion === "all" &&
        filterState.selectedFilter !== "none"
      ) {
        const departmentData = filterData.data[departmentCode];
        if (departmentData) {
          setHoveredDepartment({
            code: departmentCode,
            name: departmentName,
            data: departmentData,
            position: { x: event.x, y: event.y },
          });
        }
      }
    },
    [filterState.selectedRegion, filterState.selectedFilter, filterData.data]
  );

  const handleDepartmentSelect = useCallback(
    (departmentCode: string, departmentName: string) => {
      setSelectedDepartment({
        code: departmentCode,
        name: departmentName,
      });

      const regionCode = findRegionByDepartment(departmentCode);
      if (regionCode) {
        updateFilter("selectedRegion", regionCode);
      }

      const globalData = filterData.data[departmentCode];
      if (globalData) {
        setDepartmentData(globalData);
      }
    },
    [filterData.data, updateFilter]
  );

  const handleDepartmentLeave = useCallback(() => {
    setHoveredDepartment(null);
  }, []);

  return (
    <React.Fragment>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <Layout
        style={{
          height: "70vh",
          background: "#121c21",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <Select
            value={filterState.selectedFilter}
            onChange={(value) => {
              updateFilter("selectedFilter", value);
            }}
            style={{
              width: 220,
              borderRadius: "8px",
              color: "white",
              background: "transparent",
            }}
            dropdownStyle={{ background: "transparent", color: "white" }}
            options={availableFilters.map((o) => ({
              ...o,
              label: <span style={{ color: "white" }}>{o.label}</span>,
            }))}
            placeholder="Sélectionner..."
            size="middle"
            loading={isLoading}
          />
          <Select
            value={filterState.selectedRegion}
            onChange={handleRegionChange}
            style={{
              width: 220,
              borderRadius: 8,
              color: "white",
              background: "transparent",
            }}
            dropdownStyle={{ background: "transparent", color: "white" }}
            optionLabelProp="label"
            options={REGIONS.map((r) => ({
              ...r,
              label: <span style={{ color: "white" }}>{r.label}</span>,
            }))}
            placeholder="Choisir une région"
            size="middle"
          />
          <Select
            value={filterState.selectedYear}
            onChange={(value) => {
              updateFilter("selectedYear", value);
            }}
            style={{
              width: 220,
              borderRadius: "8px",
              color: "white",
              background: "transparent",
            }}
            dropdownStyle={{ background: "transparent", color: "white" }}
            options={AVAILABLE_YEARS.map((y) => ({
              ...y,
              label: <span style={{ color: "white" }}>{y.label}</span>,
            }))}
            placeholder="Sélectionner..."
            size="middle"
          />
          <Switch
            checked={filterState.volumeMode}
            onChange={(checked) => updateFilter("volumeMode", checked)}
            checkedChildren="VOLUME"
            unCheckedChildren="COULEUR"
            style={{
              backgroundColor: filterState.volumeMode ? "#40a9ff" : "#434343",
            }}
          />
        </div>

        <Content
          style={{
            padding: "20px",
            background: "#121c21",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card
            bordered={false}
            style={{
              width: "100%",
              maxWidth: "1600px",
              height: "100%",
              border: "none",
              overflow: "hidden",
            }}
            bodyStyle={{
              padding: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Layout
              style={{
                flex: 1,
                border: "none",
              }}
            >
              <Content
                style={{
                  padding: 0,
                  position: "relative",
                  overflow: "hidden",
                  border: "none",

                  width: "100%",
                }}
              >
                <MapTest
                  selectedRegion={filterState.selectedRegion}
                  volumeMode={filterState.volumeMode}
                  onDepartmentSelect={handleDepartmentSelect}
                  onDepartmentHover={handleDepartmentHover}
                  onDepartmentLeave={handleDepartmentLeave}
                  filterData={filterData.data}
                  selectedFilter={filterState.selectedFilter}
                  filterConfig={filterConfig}
                />

                {/* Légende dynamique */}
                <Legend
                  filterConfig={filterConfig}
                  selectedFilter={filterState.selectedFilter}
                  volumeMode={filterState.volumeMode}
                />

                {/* Panneau d'information du département (survol ou sélectionné) */}
              </Content>
              <DepartmentPanel
                selectedDepartment={selectedDepartment}
                hoveredDepartment={hoveredDepartment}
                loadingData={isLoading}
                selectedFilter={filterState.selectedFilter}
                departmentData={departmentData}
                findRegionByDepartment={findRegionByDepartment}
                selectedYear={filterState.selectedYear}
                filterConfig={filterConfig}
              />

              <Sider
                width={0}
                style={{ background: "transparent", borderLeft: "none" }}
              />
            </Layout>
          </Card>
        </Content>
      </Layout>
    </React.Fragment>
  );
}
