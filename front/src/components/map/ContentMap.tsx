import { useState } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  Space,
  Typography,
  Switch,
  Divider,
} from "antd";
import {
  EnvironmentOutlined,
  BgColorsOutlined,
  AimOutlined,
} from "@ant-design/icons";
import MapTest from "./Maps";
import { REGIONS, DEPARTEMENTS } from "../data/regions-list";

const { Text, Title } = Typography;

export default function ContentMap() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedDepartement, setSelectedDepartement] = useState<
    string | undefined
  >(undefined);
  const [colorMode, setColorMode] = useState<boolean>(false);

  // Filtrer les départements par région sélectionnée
  const filteredDepartements =
    selectedRegion && selectedRegion !== "all"
      ? DEPARTEMENTS.filter((dep) => dep.region === selectedRegion)
      : DEPARTEMENTS;

  // Quand on change de région, réinitialiser le département
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedDepartement(undefined);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div
        style={{
          padding: "24px 32px",
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Space align="center" size="middle">
          <EnvironmentOutlined style={{ fontSize: 32, color: "#ffffff" }} />
          <div>
            <Title level={3} style={{ margin: 0, color: "#ffffff" }}>
              Carte
            </Title>
            <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.7)" }}>
              Visualisez les données par région ou département
            </Text>
          </div>
        </Space>
      </div>

      {/* Zone principale */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "20px",
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
            borderRadius: 16,
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
            background: "rgba(0, 0, 0, 0.7)",
          }}
          bodyStyle={{
            padding: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Barre de contrôle en haut de la carte */}
          <div
            style={{
              padding: "16px 24px",
              background: "rgba(0, 0, 0, 0.5)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Space size="middle" wrap>
                  <Space align="center">
                    <AimOutlined style={{ color: "#ffffff", fontSize: 16 }} />
                    <Text strong style={{ color: "#ffffff" }}>
                      Région
                    </Text>
                    <Select
                      value={selectedRegion}
                      onChange={handleRegionChange}
                      style={{ width: 200 }}
                      options={REGIONS}
                      placeholder="Sélectionner..."
                      size="middle"
                    />
                  </Space>

                  <Divider
                    type="vertical"
                    style={{
                      height: 32,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  />

                  <Space align="center">
                    <EnvironmentOutlined
                      style={{ color: "#ffffff", fontSize: 16 }}
                    />
                    <Text strong style={{ color: "#ffffff" }}>
                      Département
                    </Text>
                    <Select
                      value={selectedDepartement}
                      onChange={setSelectedDepartement}
                      style={{ width: 200 }}
                      options={filteredDepartements}
                      placeholder="Sélectionner..."
                      allowClear
                      disabled={!selectedRegion || selectedRegion === "all"}
                      size="middle"
                    />
                  </Space>

                  <Divider
                    type="vertical"
                    style={{
                      height: 32,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  />

                  <Space align="center">
                    <BgColorsOutlined
                      style={{ color: "#ffffff", fontSize: 16 }}
                    />
                    <Text strong style={{ color: "#ffffff" }}>
                      Couleurs
                    </Text>
                    <Switch
                      checked={colorMode}
                      onChange={setColorMode}
                      checkedChildren="Activées"
                      unCheckedChildren="Désactivées"
                    />
                  </Space>
                </Space>
              </Col>

              {(selectedRegion !== "all" || selectedDepartement) && (
                <Col>
                  <Card
                    size="small"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 8,
                    }}
                    bodyStyle={{ padding: "4px 12px" }}
                  >
                    <Text
                      strong
                      style={{
                        color: "#ffffff",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedDepartement
                        ? `📍 ${
                            DEPARTEMENTS.find(
                              (d) => d.value === selectedDepartement
                            )?.label
                          }`
                        : selectedRegion !== "all"
                        ? `🗺️ ${
                            REGIONS.find((r) => r.value === selectedRegion)
                              ?.label
                          }`
                        : ""}
                    </Text>
                  </Card>
                </Col>
              )}
            </Row>
          </div>

          {/* Carte */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <MapTest
              selectedRegion={selectedRegion}
              selectedDepartement={selectedDepartement}
              colorMode={colorMode}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
