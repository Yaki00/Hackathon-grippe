import { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  Space,
  Typography,
  Switch,
  Layout,
} from "antd";
import {
  EnvironmentOutlined,
  BgColorsOutlined,
  AimOutlined,
} from "@ant-design/icons";
import MapTest from "./Maps";
import { REGIONS, DEPARTEMENTS } from "../data/regions-list";

const { Text, Title } = Typography;
const { Header, Content, Sider } = Layout;

interface DepartmentData {
  taux: number;
  doses: number;
  population: number;
}

export default function ContentMap() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [colorMode, setColorMode] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [selectedDepartment, setSelectedDepartment] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentData | null>(
    null
  );
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [allVaccinationData, setAllVaccinationData] = useState<
    Record<string, DepartmentData>
  >({});

  // Liste des années disponibles
  const availableYears = [
    { value: "2021", label: "2021" },
    { value: "2022", label: "2022" },
    { value: "2023", label: "2023" },
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
    { value: "2029", label: "2029" },
    { value: "2030", label: "2030" },
  ];

  // Options de filtres disponibles
  const filterOptions = [
    { value: "none", label: "Rien" },
    { value: "vaccination", label: "Taux de vaccination" },
  ];

  // Quand on change de région, garder l'année sélectionnée
  const handleRegionChange = (value: string) => {
    console.log("🔄 Changement de région:", value);
    setSelectedRegion(value);
    // Réinitialiser la sélection du département quand on change de région
    setSelectedDepartment(null);
    // Le useEffect se chargera du rechargement automatique
  };

  // Fonction pour trouver la région d'un département
  const findRegionByDepartment = (departmentCode: string): string | null => {
    const department = DEPARTEMENTS.find((dep) => dep.value === departmentCode);
    return department ? department.region : null;
  };

  // Fonction pour récupérer les données d'un département depuis l'API backend
  const fetchDepartmentData = async (
    departmentCode: string,
    filter: string
  ) => {
    if (filter === "none") {
      setDepartmentData(null);
      return;
    }

    setLoadingData(true);
    try {
      // Appel à l'API backend pour les données de vaccination par département
      const response = await fetch(
        `http://127.0.0.1:8000/vaccination/departements?annee=${selectedYear}`
      );

      console.log(
        "🔍 Statut de la réponse:",
        response.status,
        response.statusText
      );
      console.log(
        "🔍 Headers de la réponse:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Données brutes reçues de l'API:", data);
        console.log("📊 Type de données:", typeof data);
        console.log("📊 Clés disponibles:", Object.keys(data));
        console.log(
          "📊 Structure data.data:",
          data.data ? typeof data.data : "undefined"
        );
        console.log("📊 data.success:", data.success);

        if (data.success && data.departements) {
          console.log(
            "📊 Données départements trouvées:",
            data.departements.length,
            "départements"
          );

          // Trouver le département spécifique
          const departmentData = data.departements.find(
            (dept: any) => dept.code_departement === departmentCode
          );

          if (departmentData) {
            console.log(
              "📊 Données trouvées pour département",
              departmentCode,
              ":",
              departmentData
            );

            // Adapter les données selon la structure de l'API
            const adaptedData = {
              taux:
                departmentData.taux_vaccination ||
                departmentData.taux ||
                departmentData.rate ||
                0,
              doses:
                departmentData.nombre_doses ||
                departmentData.doses ||
                departmentData.doses_count ||
                0,
              population:
                departmentData.population ||
                departmentData.population_count ||
                0,
            };

            console.log("📊 Données adaptées:", adaptedData);
            setDepartmentData(adaptedData);

            // Stocker les données dans l'état global pour la carte
            if (filter === "vaccination") {
              console.log(
                "💾 Stockage des données vaccination pour département:",
                departmentCode,
                adaptedData
              );
              setAllVaccinationData((prev) => {
                const newData = {
                  ...prev,
                  [departmentCode]: adaptedData,
                };
                console.log(
                  "💾 Nouvelles données vaccination globales:",
                  newData
                );
                return newData;
              });
            }
          } else {
            console.warn(
              "Aucune donnée trouvée pour le département",
              departmentCode,
              "dans la liste des départements"
            );
            setDepartmentData(null);
          }
        } else {
          console.error("Format de données API inattendu:", data);
          setDepartmentData(null);
        }
      } else {
        console.error("❌ Erreur API:", response.status, response.statusText);
        console.error(
          "❌ URL appelée:",
          `http://127.0.0.1:8000/vaccination/departements?annee=${selectedYear}`
        );
        setDepartmentData(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setDepartmentData(null);
    } finally {
      setLoadingData(false);
    }
  };

  // Fonction pour charger les données des départements selon la région sélectionnée
  const fetchAllDepartmentsData = useCallback(
    async (filter: string) => {
      if (filter === "none") {
        setAllVaccinationData({});
        return;
      }

      console.log("🔄 Chargement des données vaccination...");
      setLoadingData(true);

      try {
        // Un seul appel pour récupérer toutes les données
        const response = await fetch(
          `http://127.0.0.1:8000/vaccination/departements?annee=${selectedYear}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Données vaccination brutes reçues de l'API:", data);
          console.log("📊 Type de données:", typeof data);
          console.log("📊 Clés disponibles:", Object.keys(data));
          console.log(
            "📊 Structure data.departements:",
            data.departements ? typeof data.departements : "undefined"
          );
          console.log("📊 data.success:", data.success);
          console.log(
            "📊 Nombre d'éléments dans data.departements:",
            Array.isArray(data.departements)
              ? data.departements.length
              : "Pas un tableau"
          );

          if (data.success && data.departements) {
            // Construire l'objet de données globales
            const allData: Record<string, DepartmentData> = {};

            // Filtrer selon la région sélectionnée
            const departmentCodesToInclude =
              selectedRegion === "all" || !selectedRegion
                ? DEPARTEMENTS.map((dept) => dept.value)
                : DEPARTEMENTS.filter(
                    (dept) => dept.region === selectedRegion
                  ).map((dept) => dept.value);

            console.log(
              `📋 Filtrage des départements pour la région ${selectedRegion}:`,
              departmentCodesToInclude
            );

            // Traiter les données reçues
            data.departements.forEach((item: any) => {
              const departmentCode = item.code_departement;
              if (
                departmentCode &&
                departmentCodesToInclude.includes(departmentCode)
              ) {
                allData[departmentCode] = {
                  taux: item.taux_vaccination || item.taux || item.rate || 0,
                  doses:
                    item.nombre_doses || item.doses || item.doses_count || 0,
                  population: item.population || item.population_count || 0,
                };
              }
            });

            console.log("✅ Données vaccination chargées:", allData);
            setAllVaccinationData(allData);
          } else {
            console.error("Format de données API inattendu:", data);
            setAllVaccinationData({});
          }
        } else {
          console.error(
            "Erreur API vaccination:",
            response.status,
            response.statusText
          );
          setAllVaccinationData({});
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données vaccination:",
          error
        );
        setAllVaccinationData({});
      } finally {
        setLoadingData(false);
      }
    },
    [selectedRegion, selectedYear]
  );

  // Gestionnaire pour la sélection d'un département
  const handleDepartmentSelect = (
    departmentCode: string,
    departmentName: string
  ) => {
    console.log("🎯 Département sélectionné:", departmentCode, departmentName);

    setSelectedDepartment({
      code: departmentCode,
      name: departmentName,
    });

    // Trouver et sélectionner la région correspondante
    const regionCode = findRegionByDepartment(departmentCode);
    if (regionCode) {
      setSelectedRegion(regionCode);
    }

    // Récupérer les données du département selon le filtre sélectionné
    // Si le filtre vaccination est actif, les données sont déjà chargées globalement
    if (selectedFilter !== "vaccination") {
      fetchDepartmentData(departmentCode, selectedFilter);
    } else {
      // Pour le filtre vaccination, utiliser les données globales déjà chargées
      const globalData = allVaccinationData[departmentCode];
      if (globalData) {
        setDepartmentData(globalData);
      }
    }
  };

  // useEffect pour recharger les données quand la région change
  useEffect(() => {
    if (selectedFilter === "vaccination") {
      console.log("🔄 Région changée, rechargement des données vaccination");
      fetchAllDepartmentsData(selectedFilter);
    }
  }, [selectedRegion, selectedFilter, fetchAllDepartmentsData]);

  // useEffect pour recharger les données quand l'année change
  useEffect(() => {
    if (selectedFilter === "vaccination") {
      console.log("🔄 Année changée, rechargement des données vaccination");
      fetchAllDepartmentsData(selectedFilter);
    }
  }, [selectedYear, selectedFilter, fetchAllDepartmentsData]);

  // useEffect pour recharger les données quand le filtre change
  useEffect(() => {
    console.log("🔄 Filtre changé, rechargement des données");
    if (selectedFilter === "vaccination") {
      fetchAllDepartmentsData(selectedFilter);
    } else if (selectedFilter === "none") {
      setAllVaccinationData({});
      setDepartmentData(null);
    }
  }, [selectedFilter, fetchAllDepartmentsData]);

  // useEffect pour charger les données au montage du composant
  useEffect(() => {
    if (selectedFilter === "vaccination") {
      console.log("🔄 Chargement initial des données vaccination");
      fetchAllDepartmentsData(selectedFilter);
    }
  }, [selectedFilter, fetchAllDepartmentsData]); // Seulement au montage

  // Fonction de test pour vérifier l'API directement
  const testAPI = async () => {
    console.log("🧪 Test de l'API vaccination...");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/vaccination/departements?annee=${selectedYear}`
      );
      console.log("🧪 Statut de test:", response.status, response.statusText);
      console.log(
        "🧪 Headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🧪 Données de test:", data);
        console.log("🧪 Type:", typeof data);
        console.log("🧪 Clés:", Object.keys(data));
      } else {
        console.error(
          "🧪 Erreur de test:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("🧪 Erreur de test:", error);
    }
  };

  // Test automatique au montage
  useEffect(() => {
    testAPI();
  }, [selectedYear]);

  return (
    <>
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
          height: "100vh",
          background: "#121c21",
        }}
      >
        <Header
          style={{
            background: "#1f2937",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: "1600px",
            }}
          >
            <Space align="center" size="large">
              <div
                style={{
                  background: "linear-gradient(135deg, #40a9ff, #1890ff)",
                  borderRadius: "50%",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(64, 169, 255, 0.3)",
                }}
              >
                <EnvironmentOutlined
                  style={{ fontSize: 32, color: "#ffffff" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <Title
                  level={1}
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "32px",
                    letterSpacing: "-0.5px",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    background: "linear-gradient(135deg, #ffffff, #e6f7ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Carte Interactive France
                </Title>
                <Text
                  style={{
                    fontSize: 16,
                    color: "rgba(255, 255, 255, 0.85)",
                    fontWeight: 500,
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  📊 Visualisez les données par région ou département
                </Text>
              </div>
            </Space>
          </div>
        </Header>

        <Content
          style={{
            padding: "20px",
            background: "#121c21",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <Card
            bordered={false}
            style={{
              width: "100%",
              maxWidth: "1600px",
              height: "100%",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              overflow: "hidden",
              background: "linear-gradient(135deg, #1f2937, #374151)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            bodyStyle={{
              padding: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Barre de contrôle en haut de la carte */}
            <Card
              size="small"
              style={{
                margin: 0,
                borderRadius: 0,
                background: "linear-gradient(135deg, #374151, #4b5563)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
              bodyStyle={{ padding: "20px 32px" }}
            >
              <Row gutter={[24, 16]} align="middle" justify="center">
                <Col flex="auto">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 20px",
                        background: "rgba(64, 169, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(64, 169, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #40a9ff, #1890ff)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#ffffff",
                            fontSize: 16,
                            fontWeight: "bold",
                          }}
                        >
                          📊
                        </span>
                      </div>
                      <Text
                        strong
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Filtre
                      </Text>
                      <Select
                        value={selectedFilter}
                        onChange={(value) => {
                          console.log("🔄 Changement de filtre:", value);
                          setSelectedFilter(value);
                          // Le useEffect se chargera du rechargement automatique
                        }}
                        style={{
                          width: 220,
                          borderRadius: "8px",
                        }}
                        options={filterOptions}
                        placeholder="Sélectionner..."
                        size="middle"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 20px",
                        background: "rgba(64, 169, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(64, 169, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #40a9ff, #1890ff)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AimOutlined
                          style={{ color: "#ffffff", fontSize: 16 }}
                        />
                      </div>
                      <Text
                        strong
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Région
                      </Text>
                      <Select
                        value={selectedRegion}
                        onChange={handleRegionChange}
                        style={{
                          width: 220,
                          borderRadius: "8px",
                        }}
                        options={REGIONS}
                        placeholder="Sélectionner..."
                        size="middle"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 20px",
                        background: "rgba(64, 169, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(64, 169, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #40a9ff, #1890ff)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#ffffff",
                            fontSize: 16,
                            fontWeight: "bold",
                          }}
                        >
                          📅
                        </span>
                      </div>
                      <Text
                        strong
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Année
                      </Text>
                      <Select
                        value={selectedYear}
                        onChange={(value) => {
                          console.log("🔄 Changement d'année:", value);
                          setSelectedYear(value);
                          // Le useEffect se chargera du rechargement automatique
                        }}
                        style={{
                          width: 220,
                          borderRadius: "8px",
                        }}
                        options={availableYears}
                        placeholder="Sélectionner..."
                        size="middle"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 20px",
                        background: "rgba(64, 169, 255, 0.1)",
                        borderRadius: "12px",
                        border: "1px solid rgba(64, 169, 255, 0.2)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #40a9ff, #1890ff)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BgColorsOutlined
                          style={{ color: "#ffffff", fontSize: 16 }}
                        />
                      </div>
                      <Text
                        strong
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Couleurs
                      </Text>
                      <Switch
                        checked={colorMode}
                        onChange={setColorMode}
                        checkedChildren="ON"
                        unCheckedChildren="OFF"
                        style={{
                          backgroundColor: colorMode ? "#40a9ff" : "#434343",
                        }}
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Layout
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #1f2937, #374151)",
                borderRadius: "0 0 16px 16px",
              }}
            >
              <Content
                style={{
                  padding: 0,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "0 0 16px 16px",
                }}
              >
                <MapTest
                  selectedRegion={selectedRegion}
                  selectedYear={selectedYear}
                  colorMode={colorMode}
                  onDepartmentSelect={handleDepartmentSelect}
                  vaccinationData={allVaccinationData}
                  selectedFilter={selectedFilter}
                />

                {/* Debug info */}
                {import.meta.env.DEV && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "10px",
                      background: "rgba(0,0,0,0.8)",
                      color: "white",
                      padding: "10px",
                      borderRadius: "5px",
                      fontSize: "12px",
                      zIndex: 1000,
                    }}
                  >
                    <div>Filtre: {selectedFilter}</div>
                    <div>
                      Données vaccination:{" "}
                      {Object.keys(allVaccinationData).length} départements
                    </div>
                    <div>
                      Départements: {Object.keys(allVaccinationData).join(", ")}
                    </div>
                  </div>
                )}

                {/* Panneau d'information du département sélectionné */}
                {selectedDepartment && (
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
                          background:
                            "linear-gradient(135deg, #40a9ff, #1890ff)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <EnvironmentOutlined
                          style={{ color: "#ffffff", fontSize: 16 }}
                        />
                      </div>
                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 600,
                          marginTop: "4px",
                        }}
                      >
                        {selectedDepartment.name}
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
                          const regionCode = findRegionByDepartment(
                            selectedDepartment.code
                          );
                          const region = REGIONS.find(
                            (r) => r.value === regionCode
                          );
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
                      ) : selectedFilter === "vaccination" && departmentData ? (
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
                            <span style={{ fontSize: 18 }}>💉</span>
                            <Text
                              style={{
                                color: "#ffffff",
                                fontSize: 16,
                                fontWeight: 600,
                              }}
                            >
                              Données de vaccination
                            </Text>
                          </div>

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
                              {departmentData.taux}%
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
                              Nombre de doses administrées
                            </Text>
                            <div
                              style={{
                                color: "#ffffff",
                                fontSize: 16,
                                fontWeight: 600,
                                marginTop: "4px",
                              }}
                            >
                              {departmentData.doses.toLocaleString()} doses
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
                              {departmentData.population.toLocaleString()}{" "}
                              habitants
                            </div>
                          </div>
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
                            Cliquez sur un autre département pour changer la
                            sélection
                          </Text>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </Content>

              <Sider
                width={0}
                style={{
                  background: "transparent",
                  borderLeft: "none",
                }}
              ></Sider>
            </Layout>
          </Card>
        </Content>
      </Layout>
    </>
  );
}
