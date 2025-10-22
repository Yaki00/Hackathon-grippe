// Service API pour les analyses IA
export interface AIAnalysisRequest {
  prompt: string;
  context_data?: any;
  context_type?: 'cout' | 'urgences';
}

export interface AIAnalysisResponse {
  analysis: string;
  recommendations?: string[];
  insights?: string[];
  status: 'success' | 'error';
  error?: string;
}

export class AIAnalysisService {
  private static baseUrl = 'http://localhost:8000';

  /**
   * Envoie une requête d'analyse IA
   */
  static async analyzeData(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      // Adapter le format pour l'endpoint backend
      const backendRequest = {
        prompt: request.prompt,
        data_type: request.context_type === 'urgences' ? 'national' : 'zones',
        model: 'llama3.2',
        annee: '2024'
      };

      const response = await fetch(`${this.baseUrl}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendRequest),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          analysis: data.data.analysis || data.data.response || 'Analyse terminée',
          recommendations: data.data.recommendations || [],
          insights: data.data.insights || [],
          status: 'success'
        };
      } else {
        return {
          analysis: data.error || 'Erreur lors de l\'analyse',
          status: 'error',
          error: data.error || 'Erreur inconnue'
        };
      }

    } catch (error) {
      console.error('Erreur lors de l\'analyse IA:', error);
      
      return {
        analysis: '❌ Erreur lors de l\'analyse IA. Vérifiez que Ollama est démarré et accessible.',
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Vérifie le statut d'Ollama
   */
  static async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/status`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'Ollama:', error);
      return false;
    }
  }

  /**
   * Génère des prompts contextuels selon le type de données
   */
  static getContextualPrompts(contextType: 'cout' | 'urgences', data?: any): string[] {
    if (contextType === 'cout') {
      return [
        "Analyse les tendances de coûts de vaccination et identifie les facteurs clés",
        "Quels sont les départements les plus coûteux et pourquoi ?",
        "Comment optimiser les coûts de vaccination tout en maintenant l'efficacité ?",
        "Compare les différents scénarios de vaccination et leurs impacts financiers",
        "Recommandations pour réduire les coûts sans compromettre la couverture",
        "Analyse la répartition des coûts entre Sécurité Sociale, mutuelles et patients",
        "Quels sont les leviers d'optimisation des coûts de vaccination ?"
      ];
    } else {
      return [
        "Analyse les tendances des urgences grippe et identifie les pics saisonniers",
        "Quelles zones géographiques ont le plus d'urgences liées à la grippe ?",
        "Comment prédire les pics d'urgences pour mieux anticiper les besoins ?",
        "Recommandations pour réduire les urgences liées à la grippe",
        "Analyse la corrélation entre vaccination et réduction des urgences",
        "Quels sont les facteurs qui influencent le nombre d'urgences grippe ?",
        "Comment optimiser la gestion des urgences pendant les épidémies ?"
      ];
    }
  }

  /**
   * Formate les données contextuelles pour l'IA
   */
  static formatContextData(data: any, contextType: 'cout' | 'urgences'): string {
    if (!data) return '';

    let context = `Contexte: Analyse des données ${contextType === 'cout' ? 'de coûts de vaccination' : 'd\'urgences grippe'}\n\n`;
    
    if (contextType === 'cout') {
      if (data.donnees_campagne) {
        context += `Campagne: ${data.campagne || '2024-2025'}\n`;
        context += `Doses distribuées: ${data.donnees_campagne.doses_distribuees?.toLocaleString() || 'N/A'}\n`;
        context += `Personnes vaccinées: ${data.donnees_campagne.personnes_vaccinees_estimees?.toLocaleString() || 'N/A'}\n`;
        context += `Taux de vaccination: ${data.donnees_campagne.taux_vaccination || 'N/A'}%\n`;
      }
      
      if (data.couts_totaux) {
        context += `\nCoûts totaux:\n`;
        context += `- Vaccins: ${data.couts_totaux.vaccins?.toLocaleString() || 'N/A'}€\n`;
        context += `- Consultations: ${data.couts_totaux.consultations?.toLocaleString() || 'N/A'}€\n`;
        context += `- Total campagne: ${data.couts_totaux.total_campagne?.toLocaleString() || 'N/A'}€\n`;
      }
      
      if (data.remboursements) {
        context += `\nRemboursements:\n`;
        context += `- Sécurité Sociale: ${data.remboursements.securite_sociale?.total?.toLocaleString() || 'N/A'}€\n`;
        context += `- Mutuelles: ${data.remboursements.mutuelles?.toLocaleString() || 'N/A'}€\n`;
        context += `- Reste à charge: ${data.remboursements.patients_reste_charge?.toLocaleString() || 'N/A'}€\n`;
      }
    } else {
      if (data.total_passages) {
        context += `Total passages urgences: ${data.total_passages?.toLocaleString() || 'N/A'}\n`;
      }
      
      if (data.evolution_mensuelle) {
        context += `\nÉvolution mensuelle:\n`;
        data.evolution_mensuelle.forEach((mois: any) => {
          context += `- ${mois.mois}: ${mois.passages?.toLocaleString() || 'N/A'} passages\n`;
        });
      }
      
      if (data.zones_plus_impactees) {
        context += `\nZones les plus impactées:\n`;
        data.zones_plus_impactees.forEach((zone: any) => {
          context += `- Zone ${zone.zone}: ${zone.passages?.toLocaleString() || 'N/A'} passages\n`;
        });
      }
    }
    
    return context;
  }
}
