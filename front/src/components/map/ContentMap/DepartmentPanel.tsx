import { Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import type {
  SelectedDepartment,
  HoveredDepartment,
} from "../../../types/vaccination";
import type { FilterConfig, FilterValue } from "../../../types/filters";
import { REGIONS } from "../../data/regions-list";
import { formatFilterValue } from "../../../utils/filterUtils";

const { Text } = Typography;

type DepartmentPanelProps = {
  selectedDepartment: SelectedDepartment | null;
  hoveredDepartment: HoveredDepartment | null;
  loadingData: boolean;
  selectedFilter: string;
  departmentData: FilterValue | null; // Type générique pour supporter tous les filtres
  findRegionByDepartment: (departmentCode: string) => string | null;
  selectedYear: string;
  filterConfig?: FilterConfig;
};

export default function DepartmentPanel({
  selectedDepartment,
  hoveredDepartment,
  loadingData,
  selectedFilter,
  departmentData,
  findRegionByDepartment,
  selectedYear,
  filterConfig,
}: DepartmentPanelProps) {
  // Déterminer quel département afficher (priorité au survol si disponible)
  const currentDepartment = hoveredDepartment || selectedDepartment;

  if (!currentDepartment) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        background: "rgba(31, 41, 55, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        minWidth: "250px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #40a9ff, #1890ff)",
            borderRadius: "50%",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <EnvironmentOutlined style={{ color: "#ffffff", fontSize: 16 }} />
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 600,
            marginTop: "4px",
          }}
        >
          {currentDepartment.name}
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 600,
            marginTop: "4px",
          }}
        >
          {(() => {
            const regionCode = findRegionByDepartment(currentDepartment.code);
            const region = REGIONS.find((r) => r.value === regionCode);
            return region ? region.label : "Région non trouvée";
          })()}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        {loadingData ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid rgba(64, 169, 255, 0.3)",
                borderTop: "2px solid #40a9ff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginRight: "8px",
              }}
            />
            Chargement des données...
          </div>
        ) : selectedFilter !== "none" &&
          (departmentData || hoveredDepartment?.data) ? (
          <div
            style={{
              background: "rgba(64, 169, 255, 0.1)",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid rgba(64, 169, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: 600 }}>
                {filterConfig?.label || selectedFilter} {selectedYear}
              </Text>
            </div>

            {/* Affichage modulaire des données selon le type de filtre */}
            {selectedFilter === "vaccination" ? (
              <>
                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Taux de vaccination
                  </Text>
                  <div
                    style={{
                      color: "#40a9ff",
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: "4px",
                    }}
                  >
                    {hoveredDepartment?.data?.taux || departmentData?.taux || 0}
                    %
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Population totale
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.population_totale ||
                      departmentData?.population_totale ||
                      hoveredDepartment?.data?.population ||
                      departmentData?.population ||
                      0
                    ).toLocaleString()}{" "}
                    habitants
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Population cible (65+)
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.population_cible ||
                      departmentData?.population_cible ||
                      0
                    ).toLocaleString()}{" "}
                    habitants
                  </div>
                </div>

                <div>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Nombre de vaccinés
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.doses ||
                      departmentData?.doses ||
                      0
                    ).toLocaleString()}{" "}
                    personnes
                  </div>
                </div>
              </>
            ) : selectedFilter === "cost" ? (
              <>
                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Coût par habitant
                  </Text>
                  <div
                    style={{
                      color: "#40a9ff",
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: "4px",
                    }}
                  >
                    {formatFilterValue(
                      hoveredDepartment?.data || departmentData,
                      filterConfig
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Coût total
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.coutTotal ||
                      departmentData?.coutTotal ||
                      0
                    ).toLocaleString()}
                    €
                  </div>
                </div>

                <div>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Nombre de vaccinés
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.nombreVaccines ||
                      departmentData?.nombreVaccines ||
                      0
                    ).toLocaleString()}
                  </div>
                </div>
              </>
            ) : selectedFilter === "emergency" ? (
              <>
                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Taux d'incidence
                  </Text>
                  <div
                    style={{
                      color: "#40a9ff",
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: "4px",
                    }}
                  >
                    {formatFilterValue(
                      hoveredDepartment?.data || departmentData,
                      filterConfig
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Passages aux urgences
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.passagesUrgences ||
                      departmentData?.passagesUrgences ||
                      0
                    ).toLocaleString()}
                  </div>
                </div>

                <div>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Actes SOS Médecins
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.actesSOSMedecins ||
                      departmentData?.actesSOSMedecins ||
                      0
                    ).toLocaleString()}
                  </div>
                </div>
              </>
            ) : selectedFilter === "doctors" ? (
              <>
                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Densité de médecins
                  </Text>
                  <div
                    style={{
                      color: "#40a9ff",
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: "4px",
                    }}
                  >
                    {formatFilterValue(
                      hoveredDepartment?.data || departmentData,
                      filterConfig
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Nombre de médecins
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {(
                      hoveredDepartment?.data?.nombreMedecins ||
                      departmentData?.nombreMedecins ||
                      0
                    ).toLocaleString()}
                  </div>
                </div>

                <div>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Spécialités disponibles
                  </Text>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    {
                      (
                        hoveredDepartment?.data?.specialites ||
                        departmentData?.specialites ||
                        []
                      ).length
                    }{" "}
                    spécialités
                  </div>
                </div>
              </>
            ) : (
              // Affichage générique pour les autres filtres
              <div>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Valeur principale
                </Text>
                <div
                  style={{
                    color: "#40a9ff",
                    fontSize: 24,
                    fontWeight: 700,
                    marginTop: "4px",
                  }}
                >
                  {formatFilterValue(
                    hoveredDepartment?.data || departmentData,
                    filterConfig
                  )}
                </div>
              </div>
            )}
          </div>
        ) : selectedFilter === "none" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              background: "rgba(64, 169, 255, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(64, 169, 255, 0.2)",
            }}
          >
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              Cliquez sur un autre département pour changer la sélection
            </Text>
          </div>
        ) : null}
      </div>
    </div>
  );
}
