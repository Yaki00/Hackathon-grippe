import styled from 'styled-components';
import { DisplayData } from '../components/DisplayData';
import { Card } from '../components/Card';
import { Table } from 'antd';
import { useEffect, useState } from 'react';
import { zoneApi } from '../api/zoneApi';
import type { VaccinationByZone, VaccinationStockByZone } from '../entities/VaccinationByZone';
				import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { aggregateByZoneAndYear, groupByZone } from '../utils';
import { LineChart, Line } from 'recharts'
const columns = [
  {
    title: 'Zone',
    dataIndex: 'zone',
    key: 'zone',
  },
  {
    title: 'Current Inventory',
    dataIndex: 'current_inventory',
    key: 'current_inventory',
	render: (text: number) => <span style={{ color: '#95a0b3' }}>{text}</span>,
  },
  {
    title: 'Forecasted Need',
    dataIndex: 'forecasted_need_30_days',
    key: 'forecasted_need_30_days',
	render: (text: number) => <span style={{ color: '#95a0b3' }}>{text}</span>,
  },
  {
	title: 'Surplus/Deficit',
	dataIndex: 'surplus_deficit',
	key: 'surplus_deficit',
	render: (text: number) => (
		<span style={{ color: text < 0 ? 'red' : 'green' }}>
			{text < 0 ? '-' : '+'}{Math.abs(text)}
		</span>
	),
  }
];


const TableStyle = styled(Table)`
	width: 100%;
	overflow-x: auto;
	.ant-table {
		background-color: transparent !important;
		color: white !important;
		border: 1px solid #1e3e54 !important;
		border-radius: 8px;
		overflow: hidden;
	}

	.ant-table-container {
		border: none;
	}

	.ant-table-thead > tr > th {
		color: white !important;
		background-color: #1e3e54 !important;
		border-bottom: 1px solid #1c374a !important;
	}

	.ant-table-thead > tr > th::before {
		display: none;
	}

	.ant-table-tbody > tr > td {
		background: #121c21 !important;
		border-left: none !important;
		border-right: none !important;
		border-top: none !important;
		border-bottom: 1px solid #1c374a !important;
	}
`;


export const Dashboard = () => {
	const [data, setData] = useState<VaccinationByZone[]>([]);
	const [dataStock, setDataStock] = useState<VaccinationStockByZone[]>([]);
	const [dataHpvByZone, setDataHpvByZone] = useState<any>([]);
	const [loadingStock, setLoadingStock] = useState<boolean>(true);
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingHpv, setLoadingHpv] = useState<boolean>(true);
	

	useEffect(() => {

		const fetchDataVaccination = async () => {
			const result = await zoneApi.getVaccinationByZone();
			console.log(result.zones);
			setData(result.zones);
			setLoading(false);
		}
		const fetchDataStock = async () => {
			const result = await zoneApi.getVaccinationStockByZone();
			console.log(result);
			setDataStock(result.data.zones);
			setLoadingStock(false);
		}
		const fetchHpvByRegion = async () => {
			const result = await zoneApi.getVaccinationHpvByRegion();
			setDataHpvByZone(aggregateByZoneAndYear(result.data));
			setLoadingHpv(false);
		}
		fetchDataVaccination();
		fetchDataStock();
		fetchHpvByRegion();
	}, []) 
	if (loading || loadingStock || loadingHpv) return <div>Loading...</div>;


	const CustomLegend = () => {
  return (
    <div style={{ color: '#eee', fontSize: 14, lineHeight: 1.6, marginLeft: 100 }}>
      <div><span style={{ color: '#6a89cc' }}>■</span> Zone A filles dose 1</div>
      <div><span style={{ color: '#78e08f' }}>■</span> Zone B filles dose 1</div>
      <div><span style={{ color: '#f6b93b' }}>■</span> Zone C filles dose 1</div>
      <div><span style={{ color: '#4834d4', borderBottom: '2px dashed #4834d4', display: 'inline-block', width: 12 }}></span> Zone A garçons dose 1 (dashed)</div>
      <div><span style={{ color: '#38ada9', borderBottom: '2px dashed #38ada9', display: 'inline-block', width: 12 }}></span> Zone B garçons dose 1 (dashed)</div>
      <div><span style={{ color: '#e58e26', borderBottom: '2px dashed #e58e26', display: 'inline-block', width: 12 }}></span> Zone C garçons dose 1 (dashed)</div>
    </div>
  );
};
  return (
	<>
			<DisplayData title="Under-Vaccinated Zones" content="Highlighting areas with low vaccination rates" type="card">
				{data.map((zone) => (
					<Card 
						key={zone.zone_code}
						title={zone.zone} 
						rate={zone.taux_vaccination} 
						content="vaccination rate" 
						vaccinatedRate={zone.taux_vaccination} 
						objectif={zone.objectif} 
					/>
				))}
			</DisplayData>
			<DisplayData title="Vaccine need prediction" content="Forcasted requirements based on current data" type="table">
				<TableStyle dataSource={dataStock} columns={columns} pagination={false} />
			</DisplayData>
			<DisplayData title="Vaccine Stock vs Need" content="Comparing current inventory with forecasted needs" type="card">


     <div style={{ backgroundColor: '#121c21', padding: 20,display: 'flex', alignItems: 'center' }}>
    <LineChart width={1000} height={400} data={dataHpvByZone}>
      <CartesianGrid stroke="#2c3e50" strokeDasharray="3 3" /> {/* grille plus sombre */}
      <XAxis dataKey="annee" stroke="#ccc" /> {/* axe X clair */}
      <YAxis stroke="#ccc" tickFormatter={(value) => `${value}%`} />
      <Tooltip
		contentStyle={{ backgroundColor: '#1f2a33', borderColor: '#555' }}
		labelStyle={{ color: '#eee' }}
		itemStyle={{ color: '#fff' }}
		formatter={(value) => `${value}%`}
		/>
      <Legend
  layout="vertical"
  align="right"
  verticalAlign="middle"
  content={<CustomLegend />}
/>
      
      {/* lignes filles dose 1 */}
      <Line type="monotone" dataKey="zoneA_dose1_filles" stroke="#6a89cc" strokeWidth={2} />
      <Line type="monotone" dataKey="zoneB_dose1_filles" stroke="#78e08f" strokeWidth={2} />
      <Line type="monotone" dataKey="zoneC_dose1_filles" stroke="#f6b93b" strokeWidth={2} />
      
      {/* lignes garçons dose 1 */}
      <Line type="monotone" dataKey="zoneA_dose1_garcons" stroke="#4834d4" strokeWidth={2} strokeDasharray="5 5" />
      <Line type="monotone" dataKey="zoneB_dose1_garcons" stroke="#38ada9" strokeWidth={2} strokeDasharray="5 5" />
      <Line type="monotone" dataKey="zoneC_dose1_garcons" stroke="#e58e26" strokeWidth={2} strokeDasharray="5 5" />
    </LineChart>
  </div>
			</DisplayData>
	</>
  );
};
