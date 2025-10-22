import React from "react";
import { Card } from "antd";
import type { FilterConfig } from "../../../types/filters";

interface LegendProps {
  filterConfig?: FilterConfig;
  selectedFilter: string;
  volumeMode: boolean;
}

interface LegendItem {
  color: [number, number, number, number];
  label: string;
  minValue?: number;
  maxValue?: number;
}

export default function Legend({
  filterConfig,
  selectedFilter,
  volumeMode,
}: LegendProps) {
  // Si aucun filtre n'est sélectionné ou si c'est "none", ne pas afficher la légende
  if (!filterConfig || selectedFilter === "none") {
    return null;
  }

  // Générer les éléments de légende selon le filtre
  const generateLegendItems = (): LegendItem[] => {
    const items: LegendItem[] = [];

    switch (selectedFilter) {
      case "vaccination":
        items.push(
          {
            color: [255, 0, 0, 255],
            label: "< 55%",
            minValue: 0,
            maxValue: 55,
          },
          {
            color: [255, 165, 0, 255],
            label: "55% - 60%",
            minValue: 55,
            maxValue: 60,
          },
          {
            color: [255, 255, 0, 255],
            label: "60% - 65%",
            minValue: 60,
            maxValue: 65,
          },
          {
            color: [0, 255, 0, 255],
            label: "≥ 65%",
            minValue: 65,
            maxValue: 100,
          }
        );
        break;

      case "cost":
        items.push(
          {
            color: [0, 255, 0, 255],
            label: "< 50€/hab",
            minValue: 0,
            maxValue: 50,
          },
          {
            color: [255, 255, 0, 255],
            label: "50€ - 100€/hab",
            minValue: 50,
            maxValue: 100,
          },
          {
            color: [255, 165, 0, 255],
            label: "100€ - 200€/hab",
            minValue: 100,
            maxValue: 200,
          },
          {
            color: [255, 0, 0, 255],
            label: "≥ 200€/hab",
            minValue: 200,
            maxValue: 1000,
          }
        );
        break;

      case "emergency":
        items.push(
          {
            color: [0, 255, 0, 255],
            label: "< 50/100k hab",
            minValue: 0,
            maxValue: 50,
          },
          {
            color: [255, 255, 0, 255],
            label: "50 - 100/100k hab",
            minValue: 50,
            maxValue: 100,
          },
          {
            color: [255, 165, 0, 255],
            label: "100 - 200/100k hab",
            minValue: 100,
            maxValue: 200,
          },
          {
            color: [255, 0, 0, 255],
            label: "≥ 200/100k hab",
            minValue: 200,
            maxValue: 1000,
          }
        );
        break;

      case "doctors":
        items.push(
          {
            color: [255, 0, 0, 255],
            label: "< 50/100k hab",
            minValue: 0,
            maxValue: 50,
          },
          {
            color: [255, 165, 0, 255],
            label: "50 - 100/100k hab",
            minValue: 50,
            maxValue: 100,
          },
          {
            color: [255, 255, 0, 255],
            label: "100 - 200/100k hab",
            minValue: 100,
            maxValue: 200,
          },
          {
            color: [0, 255, 0, 255],
            label: "≥ 200/100k hab",
            minValue: 200,
            maxValue: 1000,
          }
        );
        break;

      default:
        return [];
    }

    return items;
  };

  const legendItems = generateLegendItems();

  // Si aucun élément de légende, ne pas afficher
  if (legendItems.length === 0) {
    return null;
  }

  const getTitle = (): string => {
    switch (selectedFilter) {
      case "vaccination":
        return volumeMode
          ? "Taux de vaccination (Volume)"
          : "Taux de vaccination";
      case "cost":
        return volumeMode
          ? "Coûts de vaccination (Volume)"
          : "Coûts de vaccination";
      case "emergency":
        return volumeMode
          ? "Passages aux urgences (Volume)"
          : "Passages aux urgences";
      case "doctors":
        return volumeMode
          ? "Densité de médecins (Volume)"
          : "Densité de médecins";
      default:
        return "Légende";
    }
  };

  const getUnit = (): string => {
    switch (selectedFilter) {
      case "vaccination":
        return "%";
      case "cost":
        return "€/hab";
      case "emergency":
        return "/100k hab";
      case "doctors":
        return "/100k hab";
      default:
        return "";
    }
  };

  return (
    <Card
      size="small"
      style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        background: "rgba(18, 28, 33, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        backdropFilter: "blur(10px)",
        zIndex: 1000,
        minWidth: "200px",
      }}
      bodyStyle={{
        padding: "12px",
        background: "transparent",
      }}
    >
      <div
        style={{
          color: "white",
          marginBottom: "8px",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {getTitle()}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {legendItems.map((item, index) => (
          <div
            key={index}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: `rgba(${item.color[0]}, ${item.color[1]}, ${
                  item.color[2]
                }, ${item.color[3] / 255})`,
                borderRadius: volumeMode ? "50%" : "2px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "white", fontSize: "12px" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Indication du mode d'affichage */}
      <div
        style={{
          marginTop: "8px",
          padding: "4px 8px",
          background: "rgba(64, 169, 255, 0.2)",
          borderRadius: "4px",
          fontSize: "10px",
          color: "#40a9ff",
          textAlign: "center",
        }}
      >
        {volumeMode ? "Mode Volume 3D" : "Mode Couleur"}
      </div>
    </Card>
  );
}
