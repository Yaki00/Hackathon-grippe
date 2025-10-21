import styled from 'styled-components';
import { DisplayData } from '../components/DisplayData';
import { Card } from '../components/Card';
import { Table } from 'antd';


const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 50px auto;
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
	  margin: 0 0 50px 0;
`

const TitlePage = styled.h1`
	margin: 0;
`;


const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 40px;
	width: 100%;
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
	const data = {
		zoneA: 55,
		zoneB: 70,
		zoneC: 85,
	}
  return (
	<Container>
		<Header>
			<TitlePage>Vaccine Distribution Dashboard</TitlePage>
		</Header>
		<Content>
			<DisplayData title="Under-Vaccinated Zones" content="Highlighting areas with low vaccination rates" type="card" data={data}>
				<Card title="Zone A" rate="55" content="vaccination rate" data={data.zoneA} />
				<Card title="Zone B" rate="70" content="vaccination rate" data={data.zoneB} />
				<Card title="Zone C" rate="85" content="vaccination rate" data={data.zoneC} />
			</DisplayData>
			<DisplayData title="Vaccine need prediction" content="Forcasted requirements based on current data" type="table" data={data}>
				<TableStyle dataSource={dataSource} columns={columns} pagination={false} />

			</DisplayData>
		</Content>
	</Container>
    
  );
};
