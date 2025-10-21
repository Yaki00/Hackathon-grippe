import styled from 'styled-components';
import { DisplayData } from '../components/DisplayData';
import { Card } from '../components/Card';
import { Table } from 'antd';
import { useEffect, useState } from 'react';
import { zoneApi } from '../api/zoneApi';
import type { VaccinationByZone } from '../entities/VaccinationByZone';


const ContainerMain = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 50px auto;
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
position: sticky;
top: 0px;
width: 100%;
background-color: #121c21;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
z-index: 1000;
	  padding: 20px 40px;
	  h1{
		  margin: 0;
		  font-size: 14px;
	  }
`

const TitlePage = styled.h2`
	margin: 0;
	font-size: 40px;
`;

const ContainerHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  p{
	max-width: 500px;
	color: #95a0b3;
  }
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 40px;
	width: 100%;
	margin-top: 40px;
`

const dataSource = [
  {
	key: '1',
	zone: 'Zone A',
	currentInventory: 500,
	forecastedNeed: 800,
	surplusDeficit: -300,
  },
  {
	key: '2',
	zone: 'Zone B',
	currentInventory: 700,
	forecastedNeed: 600,
	surplusDeficit: 100,
  },
  {
	key: '3',
	zone: 'Zone C',
	currentInventory: 400,
	forecastedNeed: 900,
	surplusDeficit: -500,
  },
];

const columns = [
  {
    title: 'Zone',
    dataIndex: 'zone',
    key: 'zone',
  },
  {
    title: 'Current Inventory',
    dataIndex: 'currentInventory',
    key: 'currentInventory',
	render: (text: number) => <span style={{ color: '#95a0b3' }}>{text}</span>,
  },
  {
    title: 'Forecasted Need',
    dataIndex: 'forecastedNeed',
    key: 'forecastedNeed',
	render: (text: number) => <span style={{ color: '#95a0b3' }}>{text}</span>,
  },
  {
	title: 'Surplus/Deficit',
	dataIndex: 'surplusDeficit',
	key: 'surplusDeficit',
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
	const [loading, setLoading] = useState<boolean>(true);
	

	useEffect(() => {

		const fetchData = async () => {
			const result = await zoneApi.getVaccinationByZone();
			console.log(result.zones);
			setData(result.zones);
			setLoading(false);
		}
		fetchData();
	}, [])
	if (loading) return <div>Loading...</div>;
  return (
	<>
	<Header>
		<h1>Vision santé</h1>
	</Header>
	<ContainerMain>
		<ContainerHeader>
			<TitlePage>Dashboard sur la vaccination</TitlePage>
			<p>Suivre, visualiser et prévoir les données relatives à la vaccination contre la grippe dans toute la France.</p>
		</ContainerHeader>
		<Content>
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
				<TableStyle dataSource={dataSource} columns={columns} pagination={false} />
			</DisplayData>
		</Content>
	</ContainerMain>
	</>
  );
};
