import { Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import type { HoveredDepartment } from "../../../types/vaccination";

const { Text } = Typography;

type HoverCardProps = {
  hoveredDepartment: HoveredDepartment;
  selectedYear: string;
};

export default function HoverCard({
  hoveredDepartment,
  selectedYear,
}: HoverCardProps) {
  if (!hoveredDepartment) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: hoveredDepartment.position.x + 10,
        top: hoveredDepartment.position.y - 10,
        background: "rgba(31, 41, 55, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        minWidth: "200px",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #40a9ff, #1890ff)",
            borderRadius: "50%",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <EnvironmentOutlined style={{ color: "#ffffff", fontSize: 12 }} />
        </div>
        <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 600 }}>
          {hoveredDepartment.name}
        </div>
      </div>

      <div
        style={{
          background: "rgba(64, 169, 255, 0.1)",
          borderRadius: "8px",
          padding: "12px",
          border: "1px solid rgba(64, 169, 255, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }}>
            Vaccination {selectedYear}
          </Text>
        </div>

        <div style={{ marginBottom: "6px" }}>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            Taux de vaccination
          </Text>
          <div
            style={{
              color: "#40a9ff",
              fontSize: 18,
              fontWeight: 700,
              marginTop: "2px",
            }}
          >
            {hoveredDepartment.data.taux}%
          </div>
        </div>

        <div>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            Population
          </Text>
          <div
            style={{
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              marginTop: "2px",
            }}
          >
            {hoveredDepartment.data.population.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
