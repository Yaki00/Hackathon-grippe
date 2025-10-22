import { LineChart, Line } from "recharts";
import { CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
const CustomLegend = () => {
  return (
    <div
      style={{
        color: "#eee",
        fontSize: 14,
        lineHeight: 1.6,
        marginLeft: 20,
        minWidth: 200,
      }}
    >
      <div style={{ marginBottom: 10, fontWeight: "bold", color: "#aaa" }}>
        Tranche d'âge: 15-16 ans
      </div>
      <div>
        <span style={{ color: "#6a89cc" }}>■</span> Zone A filles dose 1
      </div>
      <div>
        <span style={{ color: "#78e08f" }}>■</span> Zone B filles dose 1
      </div>
      <div>
        <span style={{ color: "#f6b93b" }}>■</span> Zone C filles dose 1
      </div>
      <div>
        <span
          style={{
            color: "#4834d4",
            borderBottom: "2px dashed #4834d4",
            display: "inline-block",
            width: 12,
          }}
        ></span>{" "}
        Zone A garçons dose 1
      </div>
      <div>
        <span
          style={{
            color: "#38ada9",
            borderBottom: "2px dashed #38ada9",
            display: "inline-block",
            width: 12,
          }}
        ></span>{" "}
        Zone B garçons dose 1
      </div>
      <div>
        <span
          style={{
            color: "#e58e26",
            borderBottom: "2px dashed #e58e26",
            display: "inline-block",
            width: 12,
          }}
        ></span>{" "}
        Zone C garçons dose 1
      </div>
    </div>
  );
};

export const CustomLineChart = ({ dataHpvByZone }) => {
  return (
    <div
      style={{
        backgroundColor: "#121c21",
        padding: 20,
        display: "flex",
        alignItems: "center",
      }}
    >
      <LineChart width={800} height={400} data={dataHpvByZone}>
        <CartesianGrid stroke="#2c3e50" strokeDasharray="3 3" />
        <XAxis dataKey="annee" stroke="#ccc" />
        <YAxis stroke="#ccc" tickFormatter={(value) => `${value}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1f2a33", borderColor: "#555" }}
          labelStyle={{ color: "#eee" }}
          itemStyle={{ color: "#fff" }}
          formatter={(value) => `${value}%`}
        />
        <Line
          type="monotone"
          dataKey="zoneA_dose1_filles"
          stroke="#6a89cc"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="zoneB_dose1_filles"
          stroke="#78e08f"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="zoneC_dose1_filles"
          stroke="#f6b93b"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="zoneA_dose1_garcons"
          stroke="#4834d4"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="zoneB_dose1_garcons"
          stroke="#38ada9"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey="zoneC_dose1_garcons"
          stroke="#e58e26"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>

      <CustomLegend />
    </div>
  );
};
