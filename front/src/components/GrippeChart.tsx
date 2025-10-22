import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { formatGrippeData } from "../utils/utils";

const CustomLegend = () => {
	return (
		<div style={{ color: '#eee', fontSize: 14, lineHeight: 1.6, marginLeft: 20, minWidth: 200 }}>
			<div style={{ marginBottom: 10, fontWeight: 'bold', color: '#aaa' }}>Période: 2016 - 2024</div>
			<div><span style={{ color: '#6a89cc' }}>■</span> Taux moyen global</div>
			<div><span style={{ color: '#78e08f' }}>■</span> Taux 65 ans et +</div>
			<div><span style={{ color: '#f6b93b' }}>■</span> Taux moins de 65 ans</div>
		</div>
	);
};export const GrippeBarChart = ({ data }) => {
	console.log("Grippe data in chart:", data);
	return (
		<div style={{ backgroundColor: '#121c21', padding: 20, display: 'flex', alignItems: 'center' }}>
			<BarChart width={800} height={400} data={data}>
				<CartesianGrid strokeDasharray="3 3" stroke="#2c3e50" />
				<XAxis dataKey="zone" stroke="#ccc" />
				<YAxis stroke="#ccc" tickFormatter={(v) => `${v}%`} />
				<Tooltip
					contentStyle={{ backgroundColor: "#1f2a33", borderColor: "#555" }}
					labelStyle={{ color: "#eee" }}
					itemStyle={{ color: "#fff" }}
					formatter={(v) => `${v}%`}
				/>

				<Bar dataKey="global" fill="#6a89cc" name="Taux moyen global" />
				<Bar dataKey="plus65" fill="#78e08f" name="Taux 65 ans et +" />
				<Bar dataKey="moins65" fill="#f6b93b" name="Taux moins de 65 ans" />
			</BarChart>
			
			<CustomLegend />
		</div>
	);
}