import styled from 'styled-components';
import { Table, Select, Tag, Tooltip as AntTooltip, Button, Input } from 'antd';
import { useEffect, useState } from 'react';

const { TextArea } = Input;
import { urgencesApi } from '../api/urgencesApi';
import { AIAnalysisService } from '../api/aiApi';
import type { 
	UrgencesNationales, 
	UrgencesDepartementales, 
	UrgencesRegionales,
	UrgencesZone 
} from '../api/urgencesApi';
import { 
	BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
	ResponsiveContainer
} from "recharts";
import { 
	MedicineBoxOutlined, 
	LineChartOutlined, 
	WarningOutlined,
	InfoCircleOutlined,
	TeamOutlined,
	SafetyOutlined,
	BarChartOutlined,
	CalendarOutlined,
	GlobalOutlined,
	EnvironmentOutlined,
	HeartOutlined,
	PhoneOutlined,
	FilterOutlined,
	ReloadOutlined,
	SettingOutlined,
	CloseOutlined,
	SendOutlined,
	BulbOutlined,
	ThunderboltOutlined
} from '@ant-design/icons';

// === STYLED COMPONENTS (même style que CoutPage) ===

const PageContainer = styled.div`
	padding: 0;
	min-height: 100vh;
`;

const Section = styled.div`
	margin-bottom: 32px;
	animation: fadeIn 0.5s ease-in;
	
	@keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
	background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
	border-radius: 12px;
	font-size: 24px;
	color: white;
	box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
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
  grid-template-columns: repeat(${(props) => props.$cols || 4}, 1fr);
	gap: 20px;
	
	@media (max-width: 1400px) {
    grid-template-columns: repeat(
      ${(props) => Math.min(props.$cols || 4, 3)},
      1fr
    );
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
  border: 1px solid
    ${(props) =>
      props.$highlight ? "rgba(255, 77, 79, 0.3)" : "rgba(255, 255, 255, 0.1)"};
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
	
	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
		border-color: rgba(255, 77, 79, 0.5);
	}
	
	&::before {
    content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
    background: ${(props) =>
      props.$highlight
        ? "linear-gradient(90deg, #ff4d4f 0%, #faad14 100%)"
        : "linear-gradient(90deg, #ff4d4f 0%, #cf1322 100%)"};
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
  background: ${(props) => props.$color || "rgba(255, 77, 79, 0.15)"};
	border-radius: 8px;
	font-size: 16px;
  color: ${(props) => (props.$color ? "#ffffff" : "#ff4d4f")};
`;

const MetricValue = styled.div<{ $size?: "large" | "medium" | "small" }>`
  font-size: ${(props) => {
		switch (props.$size) {
      case "large":
        return "36px";
      case "small":
        return "24px";
      default:
        return "32px";
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

const StatusBadge = styled.div<{
  $status: "success" | "warning" | "info" | "danger";
}>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
  background: ${(props) => {
		switch (props.$status) {
      case "success":
        return "rgba(82, 196, 26, 0.15)";
      case "warning":
        return "rgba(250, 173, 20, 0.15)";
      case "danger":
        return "rgba(255, 77, 79, 0.15)";
      default:
        return "rgba(24, 144, 255, 0.15)";
    }
  }};
  color: ${(props) => {
		switch (props.$status) {
      case "success":
        return "#52c41a";
      case "warning":
        return "#faad14";
      case "danger":
        return "#ff4d4f";
      default:
        return "#1890ff";
    }
  }};
  border: 1px solid
    ${(props) => {
		switch (props.$status) {
        case "success":
          return "rgba(82, 196, 26, 0.3)";
        case "warning":
          return "rgba(250, 173, 20, 0.3)";
        case "danger":
          return "rgba(255, 77, 79, 0.3)";
        default:
          return "rgba(24, 144, 255, 0.3)";
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
	margin-top: 24px;
	
	.ant-table {
		background: transparent !important;
	}
	
	.ant-table-thead > tr > th {
		background: rgba(255, 255, 255, 0.05) !important;
		color: #ffffff !important;
		font-weight: 600;
		border-bottom: 2px solid rgba(255, 77, 79, 0.3) !important;
		padding: 16px;
	}
	
	.ant-table-tbody > tr {
		background: transparent !important;
		transition: all 0.3s;
		
		&:hover {
			background: rgba(255, 77, 79, 0.1) !important;
		}
		
		> td {
			border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
			color: #e6f0ff !important;
			padding: 16px;
		}
	}
	
	.ant-table-pagination {
		.ant-pagination-item {
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 77, 79, 0.3);
			
			a {
				color: #ffffff;
			}
			
			&:hover {
				border-color: #ff4d4f;
			}
			
			&-active {
				background: #ff4d4f;
				border-color: #ff4d4f;
			}
		}
		
		.ant-pagination-prev,
		.ant-pagination-next {
			button {
				background: rgba(255, 255, 255, 0.05);
				border-color: rgba(255, 77, 79, 0.3);
				color: #ffffff;
				
				&:hover {
					border-color: #ff4d4f;
					color: #ff4d4f;
				}
			}
		}
	}
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
	font-size: 18px;
	color: #8c9fb8;
`;

const ErrorContainer = styled.div`
	padding: 32px;
	border-radius: 16px;
	background: rgba(255, 77, 79, 0.1);
	border: 1px solid rgba(255, 77, 79, 0.3);
	color: #ff4d4f;
	text-align: center;
	margin: 24px 0;
`;

const FilterContainer = styled.div`
	display: flex;
  gap: 12px;
	margin-bottom: 24px;
	flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
	padding: 10px 20px;
	border-radius: 8px;
  border: 1px solid
    ${(props) => (props.$active ? "#ff4d4f" : "rgba(255, 255, 255, 0.1)")};
  background: ${(props) =>
    props.$active ? "rgba(255, 77, 79, 0.2)" : "rgba(255, 255, 255, 0.05)"};
  color: ${(props) => (props.$active ? "#ff4d4f" : "#8c9fb8")};
	cursor: pointer;
	font-size: 14px;
	font-weight: 600;
	transition: all 0.3s;
	
	&:hover {
		border-color: #ff4d4f;
		color: #ff4d4f;
		background: rgba(255, 77, 79, 0.15);
	}
`;

// === AI SIDEBAR COMPONENTS ===

const AIButton = styled.button<{ $isOpen: boolean }>`
  position: fixed !important;
  top: 20px !important;
  right: ${props => props.$isOpen ? '420px' : '20px'} !important;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #feca57 100%) !important;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
  transition: all 0.3s ease;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: rotate(45deg);
    transition: all 0.6s ease;
    opacity: 0;
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 30px rgba(255, 107, 107, 0.6);
    
    &::before {
      opacity: 1;
      animation: shimmer 1.5s ease-in-out;
    }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
`;

const AISidebar = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.$isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100vh;
  background: linear-gradient(135deg, #1a3a52 0%, #0d2a42 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
`;

const AIContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
	}
`;

// === COMPOSANT PRINCIPAL ===

export const UrgencesPage = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	
	// States pour les données
  const [urgencesNationales, setUrgencesNationales] =
    useState<UrgencesNationales | null>(null);
  const [urgencesDepartementales, setUrgencesDepartementales] =
    useState<UrgencesDepartementales | null>(null);
  const [urgencesRegionales, setUrgencesRegionales] =
    useState<UrgencesRegionales | null>(null);
	const [urgencesZoneA, setUrgencesZoneA] = useState<UrgencesZone | null>(null);
	const [urgencesZoneB, setUrgencesZoneB] = useState<UrgencesZone | null>(null);
	const [urgencesZoneC, setUrgencesZoneC] = useState<UrgencesZone | null>(null);
	
	// Filtres
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<
    string | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<
    "national" | "regional" | "departemental" | "zones"
  >("national");
  
  // IA Sidebar
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAILoading, setIsAILoading] = useState(false);
	
	// Charger les données
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError(null);
				
        const [nationales, departementales, regionales, zoneA, zoneB, zoneC] =
          await Promise.all([
					urgencesApi.getUrgencesNationales(anneeSelectionnee),
					urgencesApi.getUrgencesDepartementales(anneeSelectionnee),
					urgencesApi.getUrgencesRegionales(anneeSelectionnee),
            urgencesApi.getUrgencesZone("A", anneeSelectionnee),
            urgencesApi.getUrgencesZone("B", anneeSelectionnee),
            urgencesApi.getUrgencesZone("C", anneeSelectionnee),
				]);
				
				if (nationales.success) setUrgencesNationales(nationales.data);
        if (departementales.success)
          setUrgencesDepartementales(departementales.data);
				if (regionales.success) setUrgencesRegionales(regionales.data);
				if (zoneA.success) setUrgencesZoneA(zoneA.data);
				if (zoneB.success) setUrgencesZoneB(zoneB.data);
				if (zoneC.success) setUrgencesZoneC(zoneC.data);
			} catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
			} finally {
				setLoading(false);
			}
		};
		
		loadData();
	}, [anneeSelectionnee]);
	
	// Formatage des nombres
	const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat("fr-FR").format(Math.round(num));
	};
	
	const formatPercent = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) return "N/A";
    return num.toFixed(2) + "%";
	};
	
  const formatTauxUrgences = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) return "N/A";
		// Convertir "pour 100 000 habitants" en pourcentage
		const pourcentage = num / 1000;
    return pourcentage.toFixed(2) + "%";
  };

  // Fonctions IA
  const handleQuickPrompt = (prompt: string) => {
    setAiPrompt(prompt);
  };

  const handleAIAnalysis = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAILoading(true);
    setAiResponse('');
    
    try {
      const contextData = {
        urgencesNationales,
        urgencesDepartementales,
        urgencesRegionales,
        urgencesZoneA,
        urgencesZoneB,
        urgencesZoneC,
        viewMode,
        anneeSelectionnee
      };
      
      const response = await AIAnalysisService.analyzeData({
        prompt: `Analyse spécialisée urgences grippe: ${aiPrompt}. 
        Contexte: Données d'urgences grippe ${anneeSelectionnee || '2024'}, 
        vue ${viewMode}, 
        ${urgencesNationales ? `total passages: ${urgencesNationales.total_enregistrements}` : ''}. 
        Focus sur: taux passages urgences, hospitalisations, actes SOS médecins, corrélation avec vaccination.`,
        context_data: contextData,
        context_type: 'urgences'
      });
      
      setAiResponse(response.analysis);
    } catch (error) {
      setAiResponse('❌ Erreur lors de l\'analyse IA. Vérifiez que le backend est démarré.');
      console.error('Erreur IA:', error);
    } finally {
      setIsAILoading(false);
    }
	};

	// Couleurs pour les graphiques
  const COLORS = [
    "#ff4d4f",
    "#faad14",
    "#52c41a",
    "#1890ff",
    "#722ed1",
    "#eb2f96",
  ];
	
	if (loading) {
    return (
      <LoadingContainer>Chargement des données d'urgences...</LoadingContainer>
    );
	}
	
	if (error) {
		return <ErrorContainer>{error}</ErrorContainer>;
	}
	
	return (
		<PageContainer>
			{/* === HEADER === */}
			<Section>
        <SectionHeader>
          <SectionIcon>
            <MedicineBoxOutlined />
          </SectionIcon>
          <SectionTitle>
            <h2>Données Urgences Grippe</h2>
            <p>
              Passages aux urgences et actes SOS Médecins - Données agrégées
              Santé Publique France
            </p>
          </SectionTitle>
        </SectionHeader>

        {/* Filtres */}
				<FilterContainer>
          <FilterButton
            $active={anneeSelectionnee === undefined}
            onClick={() => setAnneeSelectionnee(undefined)}
          >
            <CalendarOutlined /> Toutes les années
          </FilterButton>
          <FilterButton
            $active={anneeSelectionnee === "2024"}
            onClick={() => setAnneeSelectionnee("2024")}
          >
            <CalendarOutlined /> 2024
          </FilterButton>
          <FilterButton
            $active={anneeSelectionnee === "2023"}
            onClick={() => setAnneeSelectionnee("2023")}
          >
            <CalendarOutlined /> 2023
          </FilterButton>
          <FilterButton
            $active={anneeSelectionnee === "2022"}
            onClick={() => setAnneeSelectionnee("2022")}
          >
            <CalendarOutlined /> 2022
          </FilterButton>
          <FilterButton
            $active={anneeSelectionnee === "2021"}
            onClick={() => setAnneeSelectionnee("2021")}
          >
            <CalendarOutlined /> 2021
          </FilterButton>
          <FilterButton
            $active={anneeSelectionnee === "2020"}
            onClick={() => setAnneeSelectionnee("2020")}
          >
            <CalendarOutlined /> 2020
          </FilterButton>
        </FilterContainer>

        {/* View Mode */}
        <FilterContainer>
          <FilterButton
            $active={viewMode === "national"}
            onClick={() => setViewMode("national")}
          >
            <GlobalOutlined /> National
          </FilterButton>
          <FilterButton
            $active={viewMode === "zones"}
            onClick={() => setViewMode("zones")}
          >
            <EnvironmentOutlined /> Par Zones
          </FilterButton>
          <FilterButton
            $active={viewMode === "regional"}
            onClick={() => setViewMode("regional")}
          >
            <EnvironmentOutlined /> Par Régions
          </FilterButton>
          <FilterButton
            $active={viewMode === "departemental"}
            onClick={() => setViewMode("departemental")}
          >
            <EnvironmentOutlined /> Par Départements
          </FilterButton>
				</FilterContainer>
			</Section>
			
			{/* === VUE NATIONALE === */}
      {viewMode === "national" && urgencesNationales && (
				<>
					<Section>
            <SectionHeader>
              <SectionIcon>
                <GlobalOutlined />
              </SectionIcon>
              <SectionTitle>
                <h2>Statistiques Nationales</h2>
                <p>Données agrégées au niveau France entière</p>
              </SectionTitle>
            </SectionHeader>

						<Grid $cols={4}>
							<MetricCard>
								<MetricHeader>
									<MetricLabel>
										<InfoCircleOutlined />
										Total Enregistrements
									</MetricLabel>
									<MetricIcon>
										<LineChartOutlined />
									</MetricIcon>
								</MetricHeader>
                <MetricValue>
                  {formatNumber(urgencesNationales.total_enregistrements)}
                </MetricValue>
								<MetricSubtext>
                  Période: {urgencesNationales.periode?.debut} -{" "}
                  {urgencesNationales.periode?.fin}
								</MetricSubtext>
							</MetricCard>
							
							<MetricCard $highlight>
								<MetricHeader>
									<MetricLabel>
										<HeartOutlined />
										Taux Passages
									</MetricLabel>
									<MetricIcon $color="rgba(255, 77, 79, 0.8)">
										<WarningOutlined />
									</MetricIcon>
								</MetricHeader>
                <MetricValue>
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales.taux_passages
                      .moyenne
                  )}
                </MetricValue>
								<MetricSubtext>
                  Min:{" "}
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales.taux_passages.min
                  )}{" "}
                  | Max:{" "}
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales.taux_passages.max
                  )}
								</MetricSubtext>
							</MetricCard>
							
							<MetricCard>
								<MetricHeader>
									<MetricLabel>
										<SafetyOutlined />
										Taux Hospitalisations
									</MetricLabel>
									<MetricIcon>
										<MedicineBoxOutlined />
									</MetricIcon>
								</MetricHeader>
                <MetricValue $size="medium">
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales
                      .taux_hospitalisations.moyenne
                  )}
                </MetricValue>
								<MetricSubtext>
                  Min:{" "}
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales
                      .taux_hospitalisations.min
                  )}{" "}
                  | Max:{" "}
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales
                      .taux_hospitalisations.max
                  )}
								</MetricSubtext>
							</MetricCard>
							
							<MetricCard>
								<MetricHeader>
									<MetricLabel>
										<PhoneOutlined />
										Taux Actes SOS
									</MetricLabel>
									<MetricIcon>
										<TeamOutlined />
									</MetricIcon>
								</MetricHeader>
                <MetricValue $size="medium">
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales.taux_actes_sos
                      .moyenne
                  )}
                </MetricValue>
								<MetricSubtext>
                  Min:{" "}
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales.taux_actes_sos.min
                  )}{" "}
                  | Max:{" "}
                  {formatTauxUrgences(
                    urgencesNationales.statistiques_globales.taux_actes_sos.max
                  )}
								</MetricSubtext>
							</MetricCard>
						</Grid>
					</Section>
					
					{/* Graphiques par groupe d'âge */}
					<Section>
						<ChartContainer>
							<ChartTitle>
								<BarChartOutlined />
								Taux Moyens par Groupe d'Âge
							</ChartTitle>
							<ResponsiveContainer width="100%" height={400}>
								<BarChart data={urgencesNationales.donnees_par_groupe_age}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
									<XAxis dataKey="groupe_age" stroke="#ffffff" />
									<YAxis stroke="#ffffff" />
									<Tooltip 
										contentStyle={{ 
                      backgroundColor: "rgba(13, 42, 66, 0.95)",
                      border: "1px solid rgba(255, 77, 79, 0.3)",
                      borderRadius: "8px",
										}}
									/>
									<Legend />
                  <Bar
                    dataKey="statistiques.taux_passages.moyenne"
                    name="Taux Passages (%)"
                    fill="#ff4d4f"
                  />
                  <Bar
                    dataKey="statistiques.taux_hospitalisations.moyenne"
                    name="Taux Hospitalisations (%)"
                    fill="#faad14"
                  />
                  <Bar
                    dataKey="statistiques.taux_actes_sos.moyenne"
                    name="Taux Actes SOS (%)"
                    fill="#52c41a"
                  />
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</Section>
					
					{/* Tableau des groupes d'âge */}
					<Section>
						<TableContainer>
							<ChartTitle>
								<InfoCircleOutlined />
								Détails par Groupe d'Âge
							</ChartTitle>
							<Table
								dataSource={urgencesNationales.donnees_par_groupe_age}
								rowKey="groupe_age"
								pagination={{ pageSize: 10 }}
								columns={[
									{
                    title: "Groupe d'Âge",
                    dataIndex: "groupe_age",
                    key: "groupe_age",
										sorter: (a, b) => a.groupe_age.localeCompare(b.groupe_age),
									},
									{
                    title: "Nb Enregistrements",
                    dataIndex: "nb_enregistrements",
                    key: "nb_enregistrements",
										render: (val) => formatNumber(val),
                    sorter: (a, b) =>
                      a.nb_enregistrements - b.nb_enregistrements,
                  },
                  {
                    title: "Taux Passages Moy.",
                    key: "taux_passages",
                    render: (_, record) =>
                      formatTauxUrgences(record.statistiques.taux_passages.moyenne),
                    sorter: (a, b) =>
                      a.statistiques.taux_passages.moyenne -
                      b.statistiques.taux_passages.moyenne,
                  },
                  {
                    title: "Taux Hospit. Moy.",
                    key: "taux_hospit",
                    render: (_, record) =>
                      formatTauxUrgences(
                        record.statistiques.taux_hospitalisations.moyenne
                      ),
                    sorter: (a, b) =>
                      a.statistiques.taux_hospitalisations.moyenne -
                      b.statistiques.taux_hospitalisations.moyenne,
                  },
                  {
                    title: "Taux SOS Moy.",
                    key: "taux_sos",
                    render: (_, record) =>
                      formatTauxUrgences(record.statistiques.taux_actes_sos.moyenne),
                    sorter: (a, b) =>
                      a.statistiques.taux_actes_sos.moyenne -
                      b.statistiques.taux_actes_sos.moyenne,
									},
								]}
							/>
						</TableContainer>
					</Section>
				</>
			)}
			
			{/* === VUE PAR ZONES === */}
      {viewMode === "zones" && (
				<>
					<Section>
						<SectionHeader>
							<SectionIcon>
								<EnvironmentOutlined />
							</SectionIcon>
						<SectionTitle>
							<h2>Comparaison par Zones (A, B, C)</h2>
							<p>Données agrégées par zone géographique</p>
						</SectionTitle>
						</SectionHeader>
						
						<Grid $cols={3}>
							{/* Zone A */}
							{urgencesZoneA && (
								<MetricCard $highlight>
									<MetricHeader>
										<MetricLabel>
											<ThunderboltOutlined />
											Zone A - Métropoles
										</MetricLabel>
										<StatusBadge $status="danger">
											{urgencesZoneA.total_regions} régions
										</StatusBadge>
									</MetricHeader>
									<MetricValue $size="small">
                    {formatTauxUrgences(
                      urgencesZoneA.statistiques.taux_passages.moyenne
                    )}
									</MetricValue>
                  <MetricSubtext>Taux de passages moyen</MetricSubtext>
                  <MetricSubtext style={{ marginTop: "8px", fontSize: "12px" }}>
                    Hospit:{" "}
                    {formatTauxUrgences(
                      urgencesZoneA.statistiques.taux_hospitalisations.moyenne
                    )}{" "}
                    | SOS:{" "}
                    {formatTauxUrgences(
                      urgencesZoneA.statistiques.taux_actes_sos.moyenne
                    )}
									</MetricSubtext>
								</MetricCard>
							)}
							
							{/* Zone B */}
							{urgencesZoneB && (
								<MetricCard>
									<MetricHeader>
										<MetricLabel>
											<EnvironmentOutlined />
											Zone B - Agglomérations
										</MetricLabel>
										<StatusBadge $status="warning">
											{urgencesZoneB.total_regions} régions
										</StatusBadge>
									</MetricHeader>
									<MetricValue $size="small">
                    {formatTauxUrgences(
                      urgencesZoneB.statistiques.taux_passages.moyenne
                    )}
									</MetricValue>
                  <MetricSubtext>Taux de passages moyen</MetricSubtext>
                  <MetricSubtext style={{ marginTop: "8px", fontSize: "12px" }}>
                    Hospit:{" "}
                    {formatTauxUrgences(
                      urgencesZoneB.statistiques.taux_hospitalisations.moyenne
                    )}{" "}
                    | SOS:{" "}
                    {formatTauxUrgences(
                      urgencesZoneB.statistiques.taux_actes_sos.moyenne
                    )}
									</MetricSubtext>
								</MetricCard>
							)}
							
							{/* Zone C */}
							{urgencesZoneC && (
								<MetricCard>
									<MetricHeader>
										<MetricLabel>
											<GlobalOutlined />
											Zone C - Reste
										</MetricLabel>
										<StatusBadge $status="info">
											{urgencesZoneC.total_regions} régions
										</StatusBadge>
									</MetricHeader>
									<MetricValue $size="small">
                    {formatTauxUrgences(
                      urgencesZoneC.statistiques.taux_passages.moyenne
                    )}
									</MetricValue>
                  <MetricSubtext>Taux de passages moyen</MetricSubtext>
                  <MetricSubtext style={{ marginTop: "8px", fontSize: "12px" }}>
                    Hospit:{" "}
                    {formatTauxUrgences(
                      urgencesZoneC.statistiques.taux_hospitalisations.moyenne
                    )}{" "}
                    | SOS:{" "}
                    {formatTauxUrgences(
                      urgencesZoneC.statistiques.taux_actes_sos.moyenne
                    )}
									</MetricSubtext>
								</MetricCard>
							)}
						</Grid>
					</Section>
					
					{/* Graphique comparatif */}
					<Section>
						<ChartContainer>
							<ChartTitle>
								<BarChartOutlined />
								Comparaison des Zones
							</ChartTitle>
							<ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    {
                      zone: "Zone A",
                      passages:
                        urgencesZoneA?.statistiques.taux_passages.moyenne || 0,
                      hospit:
                        urgencesZoneA?.statistiques.taux_hospitalisations
                          .moyenne || 0,
                      sos:
                        urgencesZoneA?.statistiques.taux_actes_sos.moyenne || 0,
                    },
                    {
                      zone: "Zone B",
                      passages:
                        urgencesZoneB?.statistiques.taux_passages.moyenne || 0,
                      hospit:
                        urgencesZoneB?.statistiques.taux_hospitalisations
                          .moyenne || 0,
                      sos:
                        urgencesZoneB?.statistiques.taux_actes_sos.moyenne || 0,
                    },
                    {
                      zone: "Zone C",
                      passages:
                        urgencesZoneC?.statistiques.taux_passages.moyenne || 0,
                      hospit:
                        urgencesZoneC?.statistiques.taux_hospitalisations
                          .moyenne || 0,
                      sos:
                        urgencesZoneC?.statistiques.taux_actes_sos.moyenne || 0,
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
									<XAxis dataKey="zone" stroke="#ffffff" />
									<YAxis stroke="#ffffff" />
									<Tooltip 
										contentStyle={{ 
                      backgroundColor: "rgba(13, 42, 66, 0.95)",
                      border: "1px solid rgba(255, 77, 79, 0.3)",
                      borderRadius: "8px",
										}}
									/>
									<Legend />
                  <Bar
                    dataKey="passages"
                    name="Taux Passages (%)"
                    fill="#ff4d4f"
                  />
                  <Bar
                    dataKey="hospit"
                    name="Taux Hospitalisations (%)"
                    fill="#faad14"
                  />
									<Bar dataKey="sos" name="Taux Actes SOS (%)" fill="#52c41a" />
								</BarChart>
							</ResponsiveContainer>
						</ChartContainer>
					</Section>
				</>
			)}
			
			{/* === VUE RÉGIONALE === */}
      {viewMode === "regional" && urgencesRegionales && (
				<Section>
					<SectionHeader>
						<SectionIcon>
							<EnvironmentOutlined />
						</SectionIcon>
						<SectionTitle>
							<h2>Données par Région</h2>
              <p>
                {urgencesRegionales.total_regions} régions -{" "}
                {formatNumber(urgencesRegionales.total_enregistrements_source)}{" "}
                enregistrements
              </p>
						</SectionTitle>
					</SectionHeader>
					
					<TableContainer>
						<Table
							dataSource={urgencesRegionales.regions}
							rowKey="code_region"
							pagination={{ pageSize: 15 }}
							columns={[
								{
                  title: "Région",
                  dataIndex: "nom_region",
                  key: "nom_region",
									sorter: (a, b) => a.nom_region.localeCompare(b.nom_region),
								},
								{
                  title: "Code",
                  dataIndex: "code_region",
                  key: "code_region",
                },
                {
                  title: "Enregistrements",
                  dataIndex: "nb_enregistrements",
                  key: "nb_enregistrements",
									render: (val) => formatNumber(val),
									sorter: (a, b) => a.nb_enregistrements - b.nb_enregistrements,
								},
								{
                  title: "Taux Passages Moy.",
                  key: "taux_passages",
									render: (_, record) => (
                    <StatusBadge
                      $status={
                        record.statistiques.taux_passages.moyenne > 5
                          ? "danger"
                          : record.statistiques.taux_passages.moyenne > 2
                          ? "warning"
                          : "success"
                      }
                    >
											{formatTauxUrgences(record.statistiques.taux_passages.moyenne)}
										</StatusBadge>
									),
                  sorter: (a, b) =>
                    a.statistiques.taux_passages.moyenne -
                    b.statistiques.taux_passages.moyenne,
                },
                {
                  title: "Taux Hospit. Moy.",
                  key: "taux_hospit",
                  render: (_, record) =>
                    formatTauxUrgences(
                      record.statistiques.taux_hospitalisations.moyenne
                    ),
                  sorter: (a, b) =>
                    a.statistiques.taux_hospitalisations.moyenne -
                    b.statistiques.taux_hospitalisations.moyenne,
                },
                {
                  title: "Taux SOS Moy.",
                  key: "taux_sos",
                  render: (_, record) =>
                    formatTauxUrgences(record.statistiques.taux_actes_sos.moyenne),
                  sorter: (a, b) =>
                    a.statistiques.taux_actes_sos.moyenne -
                    b.statistiques.taux_actes_sos.moyenne,
								},
							]}
						/>
					</TableContainer>
				</Section>
			)}
			
			{/* === VUE DÉPARTEMENTALE === */}
      {viewMode === "departemental" && urgencesDepartementales && (
				<Section>
					<SectionHeader>
						<SectionIcon>
							<EnvironmentOutlined />
						</SectionIcon>
						<SectionTitle>
							<h2>Données par Département</h2>
              <p>
                {urgencesDepartementales.total_departements} départements -{" "}
                {formatNumber(
                  urgencesDepartementales.total_enregistrements_source
                )}{" "}
                enregistrements
              </p>
						</SectionTitle>
					</SectionHeader>
					
					<TableContainer>
						<Table
							dataSource={urgencesDepartementales.departements}
							rowKey="code_departement"
							pagination={{ pageSize: 20 }}
							columns={[
								{
                  title: "Département",
                  dataIndex: "nom_departement",
                  key: "nom_departement",
                  sorter: (a, b) =>
                    a.nom_departement.localeCompare(b.nom_departement),
                },
                {
                  title: "Code",
                  dataIndex: "code_departement",
                  key: "code_departement",
									width: 80,
								},
								{
                  title: "Région",
                  dataIndex: "region",
                  key: "region",
									sorter: (a, b) => a.region.localeCompare(b.region),
								},
								{
                  title: "Enregistrements",
                  dataIndex: "nb_enregistrements",
                  key: "nb_enregistrements",
									render: (val) => formatNumber(val),
									sorter: (a, b) => a.nb_enregistrements - b.nb_enregistrements,
								},
								{
                  title: "Taux Passages",
                  key: "taux_passages",
									render: (_, record) => (
                    <StatusBadge
                      $status={
                        record.statistiques.taux_passages.moyenne > 5
                          ? "danger"
                          : record.statistiques.taux_passages.moyenne > 2
                          ? "warning"
                          : "success"
                      }
                    >
											{formatTauxUrgences(record.statistiques.taux_passages.moyenne)}
										</StatusBadge>
									),
                  sorter: (a, b) =>
                    a.statistiques.taux_passages.moyenne -
                    b.statistiques.taux_passages.moyenne,
                },
                {
                  title: "Taux Hospit.",
                  key: "taux_hospit",
                  render: (_, record) =>
                    formatTauxUrgences(
                      record.statistiques.taux_hospitalisations.moyenne
                    ),
                  sorter: (a, b) =>
                    a.statistiques.taux_hospitalisations.moyenne -
                    b.statistiques.taux_hospitalisations.moyenne,
                },
                {
                  title: "Taux SOS",
                  key: "taux_sos",
                  render: (_, record) =>
                    formatTauxUrgences(record.statistiques.taux_actes_sos.moyenne),
                  sorter: (a, b) =>
                    a.statistiques.taux_actes_sos.moyenne -
                    b.statistiques.taux_actes_sos.moyenne,
								},
							]}
						/>
					</TableContainer>
				</Section>
			)}
			
			{/* Note d'information */}
			<Section>
				<MetricCard>
					<MetricHeader>
						<MetricLabel>
							<InfoCircleOutlined />
							Note importante
						</MetricLabel>
					</MetricHeader>
					<MetricSubtext>
            {urgencesNationales?.note ||
              "Données agrégées pour optimisation - moyennes nationales/régionales/départementales"}
					</MetricSubtext>
				</MetricCard>
			</Section>

			{/* Bouton IA flottant */}
			<AIButton 
				$isOpen={isAISidebarOpen}
				onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
				style={{
					position: 'fixed',
					top: '20px',
					right: isAISidebarOpen ? '420px' : '20px',
					zIndex: 1001
				}}
			>
				✨
			</AIButton>

			{/* Barre latérale IA */}
			<AISidebar $isOpen={isAISidebarOpen}>
				<div style={{ 
					padding: '20px', 
					borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<h3 style={{ 
						color: 'white', 
						margin: 0, 
						fontSize: '18px',
						display: 'flex',
						alignItems: 'center',
						gap: '8px'
					}}>
						✨ Assistant IA - Urgences
					</h3>
					<CloseOutlined 
						onClick={() => setIsAISidebarOpen(false)}
						style={{ 
							color: 'white', 
							fontSize: '18px', 
							cursor: 'pointer' 
						}}
					/>
				</div>
				<AIContent>
					<div style={{ 
						display: 'flex', 
						flexDirection: 'column', 
						gap: '16px', 
						height: '100%' 
					}}>
						{/* Section de prompt */}
						<div>
							<label style={{ 
								color: 'white', 
								fontWeight: 600, 
								fontSize: '14px',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								marginBottom: '8px'
							}}>
								💡 Posez votre question
							</label>
							<TextArea
								value={aiPrompt}
								onChange={(e) => setAiPrompt(e.target.value)}
								placeholder="Analysez les données d'urgences..."
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									border: '1px solid rgba(255, 255, 255, 0.3)',
									borderRadius: '8px',
									color: 'white',
									minHeight: '100px',
									resize: 'none'
								}}
							/>
						</div>

						{/* Bouton d'analyse */}
						<Button
							type="primary"
							icon={<SendOutlined />}
							onClick={handleAIAnalysis}
							loading={isAILoading}
							disabled={!aiPrompt.trim() || isAILoading}
							style={{
								background: 'linear-gradient(135deg, #1890ff, #096dd9)',
								border: 'none',
								borderRadius: '8px',
								height: '40px',
								fontWeight: 600
							}}
						>
							{isAILoading ? 'Analyse en cours...' : 'Analyser avec IA'}
						</Button>

						{/* Section de réponse */}
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
							<label style={{ 
								color: 'white', 
								fontWeight: 600, 
								fontSize: '14px',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								marginBottom: '8px'
							}}>
								⚡ Réponse IA
							</label>
							<div style={{
								flex: 1,
								background: 'rgba(255, 255, 255, 0.05)',
								border: '1px solid rgba(255, 255, 255, 0.1)',
								borderRadius: '8px',
								padding: '16px',
								color: 'white',
								fontSize: '14px',
								lineHeight: '1.6',
								overflowY: 'auto'
							}}>
								{isAILoading ? (
									<div style={{ 
										display: 'flex', 
										alignItems: 'center', 
										justifyContent: 'center',
										gap: '8px',
										color: '#1890ff'
									}}>
										<div style={{
											width: '20px',
											height: '20px',
											border: '2px solid #1890ff',
											borderTop: '2px solid transparent',
											borderRadius: '50%',
											animation: 'spin 1s linear infinite'
										}} />
										Analyse en cours...
									</div>
								) : aiResponse ? (
									<div 
										style={{ whiteSpace: 'pre-wrap' }}
										dangerouslySetInnerHTML={{
											__html: aiResponse
												.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #52c41a; font-weight: 700;">$1</strong>')
												.replace(/\*(.+?)\*/g, '<em style="color: #faad14;">$1</em>')
												.replace(/^### (.+)$/gm, '<h3 style="color: #1890ff; font-size: 16px; font-weight: 700; margin: 20px 0 12px 0; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">$1</h3>')
												.replace(/^## (.+)$/gm, '<h2 style="color: #1890ff; font-size: 18px; font-weight: 700; margin: 24px 0 16px 0;">$1</h2>')
												.replace(/^# (.+)$/gm, '<h1 style="color: #1890ff; font-size: 20px; font-weight: 700; margin: 28px 0 20px 0;">$1</h1>')
												.replace(/^- (.+)$/gm, '<li style="margin: 8px 0; padding-left: 8px; border-left: 3px solid #1890ff;">$1</li>')
												.replace(/^\* (.+)$/gm, '<li style="margin: 8px 0; padding-left: 8px; border-left: 3px solid #52c41a;">$1</li>')
												.replace(/^(\d+)\. (.+)$/gm, '<div style="margin: 12px 0; padding: 12px; background: rgba(24, 144, 255, 0.1); border-radius: 8px; border-left: 4px solid #1890ff;"><strong style="color: #1890ff;">$1.</strong> $2</div>')
												.replace(/\n\n/g, '<br/><br/>')
										}}
									/>
								) : (
									<p style={{ color: '#8c9fb8', fontStyle: 'italic' }}>
										Posez une question pour obtenir une analyse IA des données d'urgences...
									</p>
								)}
							</div>
						</div>

						{/* Prompts rapides */}
						<div>
							<label style={{ 
								color: 'white', 
								fontWeight: 600, 
								fontSize: '12px',
								marginBottom: '8px',
								display: 'block'
							}}>
								Prompts rapides
							</label>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
								{[
									"Analyse les pics d'urgences grippe par zone géographique",
									"Quelle corrélation entre vaccination et réduction urgences ?",
									"Comment prédire les pics d'urgences pour anticiper ?",
									"Recommandations pour réduire les urgences grippe",
									"Analyse des taux d'hospitalisation par groupe d'âge"
								].map((prompt, index) => (
									<button
										key={index}
										onClick={() => handleQuickPrompt(prompt)}
										style={{
											background: 'rgba(255, 255, 255, 0.1)',
											border: '1px solid rgba(255, 255, 255, 0.3)',
											color: 'white',
											padding: '4px 8px',
											borderRadius: '12px',
											fontSize: '11px',
											cursor: 'pointer',
											transition: 'all 0.2s ease'
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
										}}
									>
										{prompt}
									</button>
								))}
							</div>
						</div>
					</div>
				</AIContent>
			</AISidebar>
		</PageContainer>
	);
};
