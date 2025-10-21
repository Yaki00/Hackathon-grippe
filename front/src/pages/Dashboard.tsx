import styled from 'styled-components';
import { DisplayData } from '../components/DisplayData';
import { Card } from '../components/Card';
import { Table } from 'antd';
import { useEffect, useState } from 'react';
import { zoneApi } from '../api/zoneApi';
import type { VaccinationByZone, VaccinationStockByZone } from '../entities/VaccinationByZone';
				import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { aggregateByZoneAndYear, groupByZone } from '../utils';

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


    <BarChart width={800} height={400} data={dataHpvByZone}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="annee" />
      <YAxis />
      <Tooltip />
      <Legend />

      <Bar dataKey="zoneA_dose1_filles" fill="#8884d8" />
      <Bar dataKey="zoneB_dose1_filles" fill="#82ca9d" />
      <Bar dataKey="zoneC_dose1_filles" fill="#ffc658" />
	  <Bar dataKey="zoneA_dose1_garcons" fill="#aa84d8" />
	  <Bar dataKey="zoneB_dose1_garcons" fill="#55ca9d" />
	  <Bar dataKey="zoneC_dose1_garcons" fill="#ff6658" />
      {/* tu peux ajouter d'autres Bar pour garçons et dose 2 si besoin */}
    </BarChart>
			</DisplayData>
	</>
  );
};
