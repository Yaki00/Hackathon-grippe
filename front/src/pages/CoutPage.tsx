import styled from 'styled-components';
import { DisplayData } from '../components/DisplayData';
import { Card } from '../components/Card';
import { Table, Statistic, Row, Col, Progress } from 'antd';
import { useEffect, useState } from 'react';
import { coutApi } from '../api/coutApi';
import type { CoutNational, CoutZone, ScenariosData } from '../api/coutApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

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

const StatisticStyle = styled(Statistic)`
	.ant-statistic-content {
		color: white !important;
	}
	.ant-statistic-title {
		color: #95a0b3 !important;
	}
`;

const ProgressStyle = styled(Progress)`
	.ant-progress-text {
		color: white !important;
	}
`;

const CardStyle = styled.div`
	background: #1e3e54;
	border-radius: 8px;
	padding: 24px;
	border: 1px solid #1c374a;
	margin-bottom: 20px;
	min-height: 120px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-right: 16px;
	
	&:last-child {
		margin-right: 0;
	}
`;

const RowStyle = styled.div`
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	
	@media (max-width: 768px) {
		flex-direction: column;
		gap: 12px;
	}
`;

const ColStyle = styled.div<{ $span: number }>`
	flex: ${props => props.$span};
	min-width: 0;
`;

const Title = styled.h3`
	color: white;
	margin: 0 0 15px 0;
	font-size: 18px;
`;

const Value = styled.div`
	color: white;
	font-size: 24px;
	font-weight: bold;
	margin-bottom: 5px;
`;

const Label = styled.div`
	color: #95a0b3;
	font-size: 14px;
`;

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
};

const formatNumber = (value: number) => {
	return new Intl.NumberFormat('fr-FR').format(value);
};

export const CoutPage = () => {
	const [coutNational, setCoutNational] = useState<CoutNational | null>(null);
	const [coutsZones, setCoutsZones] = useState<CoutZone[]>([]);
	const [scenarios, setScenarios] = useState<ScenariosData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Charger les coûts nationaux
				const nationalResponse = await coutApi.getCoutsNationaux();
				if (nationalResponse.success) {
					setCoutNational(nationalResponse.data);
				}

				// Charger les coûts par zone
				const zones = ['A', 'B', 'C'];
				const zonesData = await Promise.all(
					zones.map(async (zone) => {
						const response = await coutApi.getCoutsParZone(zone);
						return response.success ? response.data : null;
					})
				);
				setCoutsZones(zonesData.filter(Boolean) as CoutZone[]);

				// Charger les scénarios
				const scenariosResponse = await coutApi.getScenariosVaccination();
				if (scenariosResponse.success) {
					setScenarios(scenariosResponse.data);
				}

				setLoading(false);
			} catch (error) {
				console.error('Erreur lors du chargement des données:', error);
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) return <div>Loading...</div>;

	const columnsZones = [
		{
			title: 'Zone',
			dataIndex: 'zone',
			key: 'zone',
		},
		{
			title: 'Population',
			dataIndex: 'population',
			key: 'population',
			render: (text: number) => formatNumber(text),
		},
		{
			title: 'Taux Vaccination',
			dataIndex: 'taux_vaccination',
			key: 'taux_vaccination',
			render: (text: number) => `${(text * 100).toFixed(1)}%`,
		},
		{
			title: 'Coût Vaccination',
			dataIndex: ['couts', 'total'],
			key: 'cout_total',
			render: (text: number) => formatCurrency(text),
		},
		{
			title: 'Économies',
			dataIndex: 'economies',
			key: 'economies',
			render: (text: number) => formatCurrency(text),
		},
		{
			title: 'ROI',
			dataIndex: 'roi',
			key: 'roi',
			render: (text: number) => (
				<span style={{ color: text > 0 ? '#52c41a' : '#ff4d4f' }}>
					{text > 0 ? '+' : ''}{text.toFixed(1)}%
				</span>
			),
		},
	];

	const columnsScenarios = [
		{
			title: 'Taux Vaccination',
			dataIndex: 'taux_vaccination',
			key: 'taux_vaccination',
			render: (text: number) => `${(text * 100).toFixed(0)}%`,
		},
		{
			title: 'Personnes Vaccinées',
			dataIndex: 'personnes_vaccinees',
			key: 'personnes_vaccinees',
			render: (text: number) => formatNumber(text),
		},
		{
			title: 'Coût Total',
			dataIndex: 'cout_total',
			key: 'cout_total',
			render: (text: number) => formatCurrency(text),
		},
		{
			title: 'Économie Totale',
			dataIndex: 'economie_totale',
			key: 'economie_totale',
			render: (text: number) => formatCurrency(text),
		},
		{
			title: 'ROI',
			dataIndex: 'roi',
			key: 'roi',
			render: (text: number) => (
				<span style={{ color: text > 0 ? '#52c41a' : '#ff4d4f' }}>
					{text > 0 ? '+' : ''}{text.toFixed(1)}%
				</span>
			),
		},
	];

	// Données pour les graphiques
	const pieData = coutNational ? [
		{ name: 'Sécurité Sociale', value: coutNational.remboursements.securite_sociale.total, color: '#1890ff' },
		{ name: 'Mutuelles', value: coutNational.remboursements.mutuelles, color: '#52c41a' },
		{ name: 'Patients', value: coutNational.remboursements.reste_charge_patients, color: '#faad14' },
	] : [];

	const barDataZones = coutsZones.map(zone => ({
		zone: `Zone ${zone.zone}`,
		couts: zone.couts.total,
		economies: zone.economies,
		roi: zone.roi,
	}));

	const barDataScenarios = scenarios?.scenarios.map(scenario => ({
		taux: `${(scenario.taux_vaccination * 100).toFixed(0)}%`,
		cout: scenario.cout_total,
		economie: scenario.economie_totale,
		roi: scenario.roi,
	})) || [];

	return (
		<>
			{coutNational && (
				<>
					<DisplayData title="Coûts Nationaux de la Vaccination" content="Impact financier complet de la vaccination grippe en France" type="table">
						<RowStyle>
							<CardStyle>
								<Title>Population Française</Title>
								<Value>{formatNumber(coutNational.population_francaise)}</Value>
								<Label>habitants</Label>
							</CardStyle>
							<CardStyle>
								<Title>Taux Vaccination</Title>
								<Value>{(coutNational.taux_vaccination_actuel * 100).toFixed(1)}%</Value>
								<Label>{formatNumber(coutNational.personnes_vaccinees)} vaccinés</Label>
							</CardStyle>
							<CardStyle>
								<Title>Coût Total Vaccination</Title>
								<Value>{formatCurrency(coutNational.couts_directs.cout_total_france)}</Value>
								<Label>France entière</Label>
							</CardStyle>
							<CardStyle>
								<Title>ROI</Title>
								<Value style={{ color: coutNational.bilan_financier.roi_pourcent > 0 ? '#52c41a' : '#ff4d4f' }}>
									{coutNational.bilan_financier.roi_pourcent > 0 ? '+' : ''}{coutNational.bilan_financier.roi_pourcent.toFixed(1)}%
								</Value>
								<Label>Return on Investment</Label>
							</CardStyle>
						</RowStyle>
					</DisplayData>

					<DisplayData title=" Répartition des Coûts" content="Qui paie quoi dans la vaccination grippe" type="card">
						<Row gutter={[24, 16]}>
							<Col span={12}>
								<PieChart width={400} height={300}>
									<Pie
										data={pieData}
										cx={200}
										cy={150}
										labelLine={false}
										label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
									>
										{pieData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip formatter={(value) => formatCurrency(value as number)} />
								</PieChart>
							</Col>
							<Col span={12}>
								<div style={{ padding: '20px' }}>
									<div style={{ marginBottom: '20px' }}>
										<Label>Sécurité Sociale</Label>
										<Value>{formatCurrency(coutNational.remboursements.securite_sociale.total)}</Value>
										<ProgressStyle 
											percent={Math.round((coutNational.remboursements.securite_sociale.total / coutNational.repartition_couts.total) * 100)} 
											strokeColor="#1890ff"
										/>
									</div>
									<div style={{ marginBottom: '20px' }}>
										<Label>Mutuelles</Label>
										<Value>{formatCurrency(coutNational.remboursements.mutuelles)}</Value>
										<ProgressStyle 
											percent={Math.round((coutNational.remboursements.mutuelles / coutNational.repartition_couts.total) * 100)} 
											strokeColor="#52c41a"
										/>
									</div>
									<div>
										<Label>Reste à Charge Patients</Label>
										<Value>{formatCurrency(coutNational.remboursements.reste_charge_patients)}</Value>
										<ProgressStyle 
											percent={Math.round((coutNational.remboursements.reste_charge_patients / coutNational.repartition_couts.total) * 100)} 
											strokeColor="#faad14"
										/>
									</div>
								</div>
							</Col>
						</Row>
					</DisplayData>

					<DisplayData title=" Économies Générées" content="Coûts évités grâce à la vaccination" type="card">
						<RowStyle>
							<CardStyle>
								<Title>Consultations Évitées</Title>
								<Value>{formatCurrency(coutNational.economies_vaccination.consultations)}</Value>
							</CardStyle>
							<CardStyle>
								<Title>Arrêts Maladie Évités</Title>
								<Value>{formatCurrency(coutNational.economies_vaccination.arrets_maladie)}</Value>
								<Label>{formatNumber(coutNational.impact_economique.jours_arret_evites)} jours</Label>
							</CardStyle>
							<CardStyle>
								<Title>Hospitalisations Évitées</Title>
								<Value>{formatCurrency(coutNational.economies_vaccination.hospitalisations)}</Value>
								<Label>{formatNumber(coutNational.impact_economique.hospitalisations_evitees)} cas</Label>
							</CardStyle>
							<CardStyle>
								<Title>Total Économies</Title>
								<Value style={{ color: '#52c41a' }}>{formatCurrency(coutNational.economies_vaccination.total)}</Value>
								<Label>Économie nette</Label>
							</CardStyle>
						</RowStyle>
					</DisplayData>
				</>
			)}

			<DisplayData title="Coûts par Zone" content="Comparaison des coûts et économies par zone géographique" type="table">
				<TableStyle dataSource={coutsZones} columns={columnsZones} pagination={false} />
			</DisplayData>

			<DisplayData title="Comparaison par Zone" content="Visualisation des coûts et économies par zone" type="card">
				<BarChart width={800} height={400} data={barDataZones}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="zone" />
					<YAxis />
					<Tooltip formatter={(value) => formatCurrency(value as number)} />
					<Legend />
					<Bar dataKey="couts" fill="#ff4d4f" name="Coûts Vaccination" />
					<Bar dataKey="economies" fill="#52c41a" name="Économies Générées" />
				</BarChart>
			</DisplayData>

			{scenarios && (
				<>
					<DisplayData title="Scénarios de Vaccination" content="Comparaison de différents taux de vaccination" type="table">
						<TableStyle dataSource={scenarios.scenarios} columns={columnsScenarios} pagination={false} />
					</DisplayData>

					<DisplayData title="Recommandation" content="Taux de vaccination optimal basé sur l'analyse économique" type="card">
						<RowStyle>
							<CardStyle>
								<Title>Taux Optimal</Title>
								<Value>{(scenarios.recommandation.taux_optimal * 100).toFixed(0)}%</Value>
								<Label>Recommandé</Label>
							</CardStyle>
							<CardStyle>
								<Title>ROI Optimal</Title>
								<Value style={{ color: '#52c41a' }}>+{scenarios.recommandation.roi_optimal.toFixed(1)}%</Value>
								<Label>Return on Investment</Label>
							</CardStyle>
							<CardStyle>
								<Title>Justification</Title>
								<Value style={{ fontSize: '16px', fontWeight: 'normal' }}>{scenarios.recommandation.justification}</Value>
							</CardStyle>
						</RowStyle>
					</DisplayData>

					<DisplayData title="Comparaison des Scénarios" content="Évolution des coûts et économies selon le taux de vaccination" type="card">
						<BarChart width={800} height={400} data={barDataScenarios}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="taux" />
							<YAxis />
							<Tooltip formatter={(value) => formatCurrency(value as number)} />
							<Legend />
							<Bar dataKey="cout" fill="#ff4d4f" name="Coût Total" />
							<Bar dataKey="economie" fill="#52c41a" name="Économie Totale" />
						</BarChart>
					</DisplayData>
				</>
			)}
		</>
	);
};
