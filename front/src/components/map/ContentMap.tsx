import { useState } from "react";
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
import { REGIONS } from "../data/regions-list";

const { Text, Title } = Typography;
const { Header, Content, Sider } = Layout;

export default function ContentMap() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [colorMode, setColorMode] = useState<boolean>(false);

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

  // Quand on change de région, garder l'année sélectionnée
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
  };

  return (
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
              <EnvironmentOutlined style={{ fontSize: 32, color: "#ffffff" }} />
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
                        background: "linear-gradient(135deg, #40a9ff, #1890ff)",
                        borderRadius: "50%",
                        padding: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AimOutlined style={{ color: "#ffffff", fontSize: 16 }} />
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
                        background: "linear-gradient(135deg, #40a9ff, #1890ff)",
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
                      onChange={setSelectedYear}
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
                        background: "linear-gradient(135deg, #40a9ff, #1890ff)",
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
              />
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
  );
}
