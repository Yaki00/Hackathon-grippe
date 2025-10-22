import styled from 'styled-components';
import { DisplayData } from '../components/DisplayData';
import { Table } from 'antd';
import { useEffect, useState } from 'react';
import { coutApi } from '../api/coutApi';
import type { CoutNational, CoutZone, ScenariosData, PredictionData } from '../api/coutApi';
import { 
	BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
	PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Area, AreaChart 
} from "recharts";
import { 
	DollarOutlined, 
	MedicineBoxOutlined, 
	LineChartOutlined, 
	PieChartOutlined,
	RiseOutlined,
	FallOutlined,
	CheckCircleOutlined,
	WarningOutlined,
	InfoCircleOutlined,
	BankOutlined,
	TeamOutlined,
	ShopOutlined,
	SafetyOutlined,
	TrophyOutlined,
	BarChartOutlined,
	ThunderboltOutlined,
	CalendarOutlined,
	GlobalOutlined
} from '@ant-design/icons';

// === STYLED COMPONENTS ===

const PageContainer = styled.div`
	padding: 0;
	min-height: 100vh;
`;

const Section = styled.div`
	margin-bottom: 32px;
	animation: fadeIn 0.5s ease-in;
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 24px;
	padding: 20px 28px;
	background: linear-gradient(135deg, #1a3a52 0%, #0d2a42 100%);
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const SectionIcon = styled.div`
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
	border-radius: 12px;
	font-size: 24px;
	color: white;
	box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
`;

const SectionTitle = styled.div`
	flex: 1;
	
	h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.5px;
	}
	
	p {
		margin: 4px 0 0 0;
		font-size: 14px;
		color: #8c9fb8;
		font-weight: 400;
	}
`;

const Grid = styled.div<{ $cols?: number }>`
	display: grid;
	grid-template-columns: repeat(${props => props.$cols || 4}, 1fr);
	gap: 20px;
	
	@media (max-width: 1400px) {
		grid-template-columns: repeat(${props => Math.min(props.$cols || 4, 3)}, 1fr);
	}
	
	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
	}
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const MetricCard = styled.div<{ $highlight?: boolean }>`
	
	border-radius: 16px;
	padding: 24px;
	border: 1px solid ${props => props.$highlight ? 'rgba(24, 144, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
	
	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
		border-color: rgba(24, 144, 255, 0.5);
	}
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: ${props => props.$highlight 
			? 'linear-gradient(90deg, #1890ff 0%, #52c41a 100%)' 
			: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)'};
	}
`;

const MetricHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
`;

const MetricLabel = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #8c9fb8;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const MetricIcon = styled.div<{ $color?: string }>`
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${props => props.$color || 'rgba(24, 144, 255, 0.15)'};
	border-radius: 8px;
	font-size: 16px;
	color: ${props => props.$color ? '#ffffff' : '#1890ff'};
`;

const MetricValue = styled.div<{ $size?: 'large' | 'medium' | 'small' }>`
	font-size: ${props => {
		switch (props.$size) {
			case 'large': return '36px';
			case 'small': return '24px';
			default: return '32px';
		}
	}};
	font-weight: 700;
	color: #ffffff;
	margin-bottom: 8px;
	line-height: 1.2;
`;

const MetricSubtext = styled.div`
	font-size: 13px;
	color: #8c9fb8;
	display: flex;
	align-items: center;
	gap: 6px;
`;

const StatusBadge = styled.div<{ $status: 'success' | 'warning' | 'info' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	background: ${props => {
		switch (props.$status) {
			case 'success': return 'rgba(82, 196, 26, 0.15)';
			case 'warning': return 'rgba(250, 173, 20, 0.15)';
			case 'danger': return 'rgba(255, 77, 79, 0.15)';
			default: return 'rgba(24, 144, 255, 0.15)';
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'success': return '#52c41a';
			case 'warning': return '#faad14';
			case 'danger': return '#ff4d4f';
			default: return '#1890ff';
		}
	}};
	border: 1px solid ${props => {
		switch (props.$status) {
			case 'success': return 'rgba(82, 196, 26, 0.3)';
			case 'warning': return 'rgba(250, 173, 20, 0.3)';
			case 'danger': return 'rgba(255, 77, 79, 0.3)';
			default: return 'rgba(24, 144, 255, 0.3)';
		}
	}};
`;

const ChartContainer = styled.div`
	
	border-radius: 16px;
	padding: 32px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	margin-top: 24px;
`;

const ChartTitle = styled.h3`
	margin: 0 0 24px 0;
	font-size: 18px;
	font-weight: 600;
	color: #ffffff;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const TableContainer = styled.div`
	border-radius: 16px;
	padding: 24px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	overflow: hidden;
`;

const StyledTable = styled(Table)`
	.ant-table {
		background: transparent !important;
		color: white !important;
	}

	.ant-table-thead > tr > th {
		color: #ffffff !important;
		background: rgba(24, 144, 255, 0.1) !important;
		border-bottom: 2px solid rgba(24, 144, 255, 0.3) !important;
		font-weight: 600;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 16px;
	}

	.ant-table-thead > tr > th::before {
		display: none;
	}

	.ant-table-tbody > tr > td {
		background: transparent !important;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
		color: #ffffff !important;
		padding: 16px;
		font-size: 14px;
	}
	
	.ant-table-tbody > tr:hover > td {
		background: rgba(24, 144, 255, 0.05) !important;
	}
`;

const PredictionCard = styled.div`
	background: linear-gradient(135deg, #0f2744 0%, #0a1628 100%);
	border-radius: 12px;
	padding: 20px;
	border: 1px solid rgba(24, 144, 255, 0.2);
	transition: all 0.3s ease;
	
	&:hover {
		border-color: rgba(24, 144, 255, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
	}
`;

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	color: #8c9fb8;
	
	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(24, 144, 255, 0.1);
		border-top-color: #1890ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	p {
		margin-top: 16px;
		font-size: 16px;
	}
`;

const Divider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
	margin: 32px 0;
`;

// === UTILITY FUNCTIONS ===

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

const formatNumberShort = (value: number) => {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	} else if (value >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toString();
};

// === MAIN COMPONENT ===

export const CoutPage = () => {
	const [coutNational, setCoutNational] = useState<CoutNational | null>(null);
	const [coutsZones, setCoutsZones] = useState<CoutZone[]>([]);
	const [scenarios, setScenarios] = useState<ScenariosData | null>(null);
	const [predictions, setPredictions] = useState<PredictionData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [nationalResponse, zonesA, zonesB, zonesC, scenariosResponse, predictionsResponse] = await Promise.all([
					coutApi.getCoutsNationaux(),
					coutApi.getCoutsParZone('A'),
					coutApi.getCoutsParZone('B'),
					coutApi.getCoutsParZone('C'),
					coutApi.getScenariosVaccination(),
					coutApi.getPredictionsNationales(3),
				]);

				if (nationalResponse.success) setCoutNational(nationalResponse.data);
				
				const zonesData = [zonesA, zonesB, zonesC]
					.filter(z => z.success)
					.map(z => z.data);
				setCoutsZones(zonesData as CoutZone[]);

				if (scenariosResponse.success) setScenarios(scenariosResponse.data);
				if (predictionsResponse.success) setPredictions(predictionsResponse.data);

				setLoading(false);
			} catch (error) {
				console.error('Erreur:', error);
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<PageContainer>
				<LoadingContainer>
					<div className="spinner" />
					<p>Chargement des données financières...</p>
				</LoadingContainer>
			</PageContainer>
		);
	}

	// Table columns
	const columnsZones = [
		{
			title: 'Zone',
			dataIndex: 'zone',
			key: 'zone',
			render: (text: string) => <span style={{ fontWeight: 600 }}>Zone {text}</span>,
		},
		{
			title: 'Population',
			dataIndex: 'population',
			key: 'population',
			render: (text: number) => formatNumber(text),
		},
		{
			title: 'Taux Vaccination',
			dataIndex: 'taux_vaccination_pourcent',
			key: 'taux',
			render: (text: number) => (
				<StatusBadge $status={text >= 40 ? 'success' : text >= 30 ? 'info' : 'warning'}>
					<RiseOutlined />
					{text}%
				</StatusBadge>
			),
		},
		{
			title: 'Personnes Vaccinées',
			dataIndex: 'personnes_vaccinees',
			key: 'personnes_vaccinees',
			render: (text: number) => formatNumber(text),
		},
		{
			title: 'Coût Total',
			dataIndex: ['couts_vaccination', 'total'],
			key: 'cout_total',
			render: (text: number) => <strong>{formatCurrency(text)}</strong>,
		},
		{
			title: 'Coût / Personne',
			dataIndex: 'cout_par_personne_vaccinee',
			key: 'cout_par_personne',
			render: (text: number) => formatCurrency(text),
		},
	];

	const columnsScenarios = [
		{
			title: 'Scénario',
			dataIndex: 'nom',
			key: 'nom',
			render: (text: string) => <strong>{text}</strong>,
		},
		{
			title: 'Description',
			dataIndex: 'description',
			key: 'description',
		},
		{
			title: 'Taux',
			dataIndex: 'taux_vaccination_pourcent',
			key: 'taux',
			render: (text: number) => `${text}%`,
		},
		{
			title: 'Personnes Vaccinées',
			dataIndex: 'personnes_vaccinees',
			key: 'personnes_vaccinees',
			render: (text: number) => formatNumber(text),
		},
		{
			title: 'Coût Total',
			dataIndex: ['couts', 'total'],
			key: 'cout_total',
			render: (text: number) => <strong>{formatCurrency(text)}</strong>,
		},
	];

	// Chart data
	const pieData = coutNational ? [
		{ name: 'Sécurité Sociale', value: coutNational.remboursements.securite_sociale.total, color: '#1890ff' },
		{ name: 'Mutuelles', value: coutNational.remboursements.mutuelles, color: '#52c41a' },
		{ name: 'Patients', value: coutNational.remboursements.patients_reste_charge, color: '#faad14' },
	] : [];

	const barDataZones = coutsZones.map(zone => ({
		zone: `Zone ${zone.zone}`,
		vaccins: zone.couts_vaccination.vaccins,
		consultations: zone.couts_vaccination.consultations,
	}));

	const lineDataScenarios = scenarios?.scenarios.map(scenario => ({
		taux: `${scenario.taux_vaccination_pourcent}%`,
		cout_total: scenario.couts.total,
		cout_vaccins: scenario.couts.vaccins,
		cout_consultations: scenario.couts.consultations,
	})) || [];

	const predictionsChartData = predictions ? predictions.predictions.map(pred => ({
		mois: pred.mois_nom.split(' ')[0],
		doses: pred.doses_necessaires,
		min: pred.doses_necessaires_min,
		max: pred.doses_necessaires_max,
	})) : [];

	return (
		<PageContainer>
			{/* SECTION 1: Vue d'ensemble */}
			{coutNational && (
				<Section>

					<Grid $cols={4}>
						<MetricCard $highlight>
							<MetricHeader>
								<MetricLabel>
									<MedicineBoxOutlined />
									Doses Distribuées
								</MetricLabel>
								<MetricIcon $color="rgba(24, 144, 255, 0.2)">
									<BarChartOutlined style={{ color: '#1890ff' }} />
								</MetricIcon>
							</MetricHeader>
							<MetricValue $size="large">
								{formatNumber(coutNational.donnees_campagne.doses_distribuees)}
							</MetricValue>
							<MetricSubtext>
								<TeamOutlined />
								{formatNumber(coutNational.donnees_campagne.personnes_vaccinees_estimees)} personnes vaccinées
							</MetricSubtext>
							<div style={{ marginTop: '12px' }}>
								<StatusBadge $status="success">
									<CheckCircleOutlined />
									Données Réelles IQVIA
								</StatusBadge>
							</div>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<LineChartOutlined />
									Taux de Vaccination
								</MetricLabel>
								<MetricIcon>
									<RiseOutlined />
								</MetricIcon>
							</MetricHeader>
							<MetricValue>
								{coutNational.donnees_campagne.taux_vaccination.toFixed(1)}%
							</MetricValue>
							<MetricSubtext>
								<GlobalOutlined />
								Population: {formatNumberShort(coutNational.donnees_campagne.population_france)}
							</MetricSubtext>
							<div style={{ marginTop: '12px' }}>
								<StatusBadge $status="info">
									<InfoCircleOutlined />
									National
								</StatusBadge>
							</div>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<DollarOutlined />
									Coût Total Campagne
								</MetricLabel>
								<MetricIcon>
									<BankOutlined />
								</MetricIcon>
							</MetricHeader>
							<MetricValue $size="medium">
								{formatCurrency(coutNational.couts_totaux.total_campagne)}
							</MetricValue>
							<MetricSubtext>
								Vaccins + Consultations
							</MetricSubtext>
							<div style={{ marginTop: '12px' }}>
								<StatusBadge $status="warning">
									<SafetyOutlined />
									Tarifs Officiels
								</StatusBadge>
							</div>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<ShopOutlined />
									Tarifs Unitaires
								</MetricLabel>
								<MetricIcon>
									<InfoCircleOutlined />
								</MetricIcon>
							</MetricHeader>
							<MetricValue $size="small">
								{formatCurrency(coutNational.tarifs_officiels.vaccin_total)}
							</MetricValue>
							<MetricSubtext>
								Vaccin + Honoraire pharmacien
							</MetricSubtext>
							<MetricSubtext style={{ marginTop: '8px' }}>
								Consultation: {formatCurrency(coutNational.tarifs_officiels.consultation)}
							</MetricSubtext>
						</MetricCard>
					</Grid>
				</Section>
			)}

			{/* SECTION 2: Prédictions */}
			{predictions && (
				<Section>
					<SectionHeader>
						<SectionIcon>
							<ThunderboltOutlined />
						</SectionIcon>
						<SectionTitle>
							<h2>Historique & Prédictions de Consommation</h2>
							<p>{predictions.methode} • {predictions.source}</p>
						</SectionTitle>
					</SectionHeader>

					<Grid $cols={4}>
						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<BarChartOutlined />
									Total Distribué
								</MetricLabel>
							</MetricHeader>
							<MetricValue>
								{formatNumberShort(predictions.statistiques_historiques.total_doses_distribuees)}
							</MetricValue>
							<MetricSubtext>
								<CalendarOutlined />
								{predictions.statistiques_historiques.periode_analysee}
							</MetricSubtext>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<LineChartOutlined />
									Moyenne Mensuelle
								</MetricLabel>
							</MetricHeader>
							<MetricValue>
								{formatNumberShort(predictions.statistiques_historiques.moyenne_mensuelle)}
							</MetricValue>
							<MetricSubtext>
								<RiseOutlined />
								Tendance: {predictions.statistiques_historiques.tendance}
							</MetricSubtext>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<TrophyOutlined />
									Pic Mensuel
								</MetricLabel>
							</MetricHeader>
							<MetricValue>
								{formatNumberShort(predictions.statistiques_historiques.pic_mensuel)}
							</MetricValue>
							<MetricSubtext>
								Record historique
							</MetricSubtext>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<CalendarOutlined />
									Contexte Actuel
								</MetricLabel>
							</MetricHeader>
							<MetricValue $size="small" style={{ fontSize: '18px' }}>
								{predictions.contexte.saison}
							</MetricValue>
							<MetricSubtext>
								Facteur saisonnier: {(predictions.contexte.facteur_saisonnier * 100).toFixed(0)}%
							</MetricSubtext>
						</MetricCard>
					</Grid>

					<ChartContainer>
						<ChartTitle>
							<LineChartOutlined />
							Évolution Prévue des Doses
						</ChartTitle>
						<ResponsiveContainer width="100%" height={400}>
							<AreaChart data={predictionsChartData}>
								<defs>
									<linearGradient id="colorDoses" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
										<stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
								<XAxis 
									dataKey="mois" 
									stroke="#8c9fb8"
									tick={{ fill: '#8c9fb8', fontSize: 12 }}
								/>
								<YAxis 
									stroke="#8c9fb8"
									tick={{ fill: '#8c9fb8', fontSize: 12 }}
									tickFormatter={formatNumberShort}
								/>
								<Tooltip 
									formatter={(value: number) => [formatNumber(value), 'Doses']}
									contentStyle={{ 
										backgroundColor: '#0d2a42', 
										border: '1px solid rgba(24, 144, 255, 0.3)',
										borderRadius: '8px',
										color: '#ffffff'
									}}
								/>
								<Legend 
									wrapperStyle={{ color: '#ffffff' }}
									iconType="circle"
								/>
								<Area 
									type="monotone" 
									dataKey="max" 
									stroke="#faad14" 
									fill="rgba(250, 173, 20, 0.1)" 
									name="Maximum"
									strokeWidth={2}
								/>
								<Area 
									type="monotone" 
									dataKey="doses" 
									stroke="#1890ff" 
									fill="url(#colorDoses)" 
									name="Prévision"
									strokeWidth={3}
								/>
								<Area 
									type="monotone" 
									dataKey="min" 
									stroke="#52c41a" 
									fill="rgba(82, 196, 26, 0.1)" 
									name="Minimum"
									strokeWidth={2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>

					<Grid $cols={3} style={{ marginTop: '24px' }}>
						{predictions.predictions.map((pred, idx) => (
							<PredictionCard key={idx}>
								<MetricLabel style={{ marginBottom: '12px' }}>
									<CalendarOutlined />
									{pred.mois_nom}
								</MetricLabel>
								<MetricValue $size="medium">
									{formatNumberShort(pred.doses_necessaires)}
								</MetricValue>
								<MetricSubtext>
									{formatNumber(pred.doses_necessaires_min)} - {formatNumber(pred.doses_necessaires_max)}
								</MetricSubtext>
								<div style={{ marginTop: '12px' }}>
									<StatusBadge $status={pred.confiance === 'haute' ? 'success' : 'info'}>
										<CheckCircleOutlined />
										Confiance {pred.confiance}
									</StatusBadge>
								</div>
							</PredictionCard>
						))}
					</Grid>
				</Section>
			)}

			<Divider />

			{/* SECTION 3: Répartition financière */}
			{coutNational && (
				<>
					<DisplayData title="Coûts Nationaux de la Vaccination" content="Impact financier complet de la vaccination grippe en France" type="card">
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
										cx="50%"
										cy="50%"
										labelLine={false}
										label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
										outerRadius={120}
										fill="#8884d8"
										dataKey="value"
									>
										{pieData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip 
										formatter={(value) => formatCurrency(value as number)}
										contentStyle={{ 
											backgroundColor: '#0d2a42', 
											border: '1px solid rgba(24, 144, 255, 0.3)',
											borderRadius: '8px',
											color: '#ffffff'
										}}
									/>
								</PieChart>
							</ResponsiveContainer>

							<div>
								<MetricCard style={{ marginBottom: '16px' }}>
									<MetricHeader>
										<MetricLabel>
											<BankOutlined />
											Sécurité Sociale
										</MetricLabel>
									</MetricHeader>
									<MetricValue $size="medium">
										{formatCurrency(coutNational.remboursements.securite_sociale.total)}
									</MetricValue>
									<MetricSubtext>
										Taux: {coutNational.remboursements.securite_sociale.taux_vaccin} vaccins • 
										{coutNational.remboursements.securite_sociale.taux_consultation} consultations
									</MetricSubtext>
								</MetricCard>

								<MetricCard style={{ marginBottom: '16px' }}>
									<MetricHeader>
										<MetricLabel>
											<SafetyOutlined />
											Mutuelles
										</MetricLabel>
									</MetricHeader>
									<MetricValue $size="medium">
										{formatCurrency(coutNational.remboursements.mutuelles)}
									</MetricValue>
									<MetricSubtext>
										{coutNational.repartition_financiere.mutuelles_pourcent.toFixed(1)}% du total
									</MetricSubtext>
								</MetricCard>

								<MetricCard>
									<MetricHeader>
										<MetricLabel>
											<TeamOutlined />
											Patients (Reste à charge)
										</MetricLabel>
									</MetricHeader>
									<MetricValue $size="medium">
										{formatCurrency(coutNational.remboursements.patients_reste_charge)}
									</MetricValue>
									<MetricSubtext>
										{coutNational.repartition_financiere.patients_pourcent.toFixed(1)}% du total
									</MetricSubtext>
								</MetricCard>
							</div>
						</div>
					</ChartContainer>
				</Section>
			)}

			<Divider />
			{scenarios && (
				<Section>
					<SectionHeader>
						<SectionIcon>
							<LineChartOutlined />
						</SectionIcon>
						<SectionTitle>
							<h2>{scenarios.titre}</h2>
							<p>Simulation de l'impact financier selon différents taux de couverture</p>
						</SectionTitle>
					</SectionHeader>

					<TableContainer>
						<StyledTable 
							dataSource={scenarios.scenarios} 
							columns={columnsScenarios} 
							pagination={false}
							rowKey="nom"
						/>
					</TableContainer>

					<ChartContainer>
						<ChartTitle>
							<LineChartOutlined />
							Évolution des Coûts par Scénario
						</ChartTitle>
						<ResponsiveContainer width="100%" height={350}>
							<LineChart data={lineDataScenarios}>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
								<XAxis 
									dataKey="taux" 
									stroke="#8c9fb8"
									tick={{ fill: '#8c9fb8', fontSize: 12 }}
								/>
								<YAxis 
									stroke="#8c9fb8"
									tick={{ fill: '#8c9fb8', fontSize: 12 }}
									tickFormatter={formatNumberShort}
								/>
								<Tooltip 
									formatter={(value) => formatCurrency(value as number)}
									contentStyle={{ 
										backgroundColor: '#0d2a42', 
										border: '1px solid rgba(24, 144, 255, 0.3)',
										borderRadius: '8px',
										color: '#ffffff'
									}}
								/>
								<Legend wrapperStyle={{ color: '#ffffff' }} />
								<Line 
									type="monotone" 
									dataKey="cout_total" 
									stroke="#ff4d4f" 
									strokeWidth={3} 
									name="Coût Total"
									dot={{ fill: '#ff4d4f', r: 6 }}
								/>
								<Line 
									type="monotone" 
									dataKey="cout_vaccins" 
									stroke="#1890ff" 
									strokeWidth={2} 
									name="Vaccins"
									dot={{ fill: '#1890ff', r: 4 }}
								/>
								<Line 
									type="monotone" 
									dataKey="cout_consultations" 
									stroke="#52c41a" 
									strokeWidth={2} 
									name="Consultations"
									dot={{ fill: '#52c41a', r: 4 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</ChartContainer>

					<Grid $cols={2} style={{ marginTop: '24px' }}>
						<MetricCard $highlight>
							<MetricHeader>
								<MetricLabel>
									<TrophyOutlined />
									Recommandation OMS
								</MetricLabel>
								<MetricIcon $color="rgba(82, 196, 26, 0.2)">
									<CheckCircleOutlined style={{ color: '#52c41a' }} />
								</MetricIcon>
							</MetricHeader>
							<MetricValue style={{ color: '#52c41a' }}>
								{scenarios.recommandation.taux_recommande}
							</MetricValue>
							<MetricSubtext>
								{scenarios.recommandation.justification}
							</MetricSubtext>
						</MetricCard>

						<MetricCard>
							<MetricHeader>
								<MetricLabel>
									<DollarOutlined />
									Coût Estimé
								</MetricLabel>
								<MetricIcon>
									<BarChartOutlined />
								</MetricIcon>
							</MetricHeader>
							<MetricValue>
								{formatCurrency(scenarios.recommandation.cout_estime)}
							</MetricValue>
							<MetricSubtext>
								Pour atteindre l'objectif recommandé
							</MetricSubtext>
						</MetricCard>
					</Grid>
				</Section>
			)}
		</PageContainer>
	);
};
