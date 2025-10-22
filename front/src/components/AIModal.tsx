import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  RobotOutlined, 
  CloseOutlined, 
  SendOutlined, 
  LoadingOutlined,
  DragOutlined,
  BulbOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Button, Input, message } from 'antd';

const { TextArea } = Input;

// === STYLED COMPONENTS ===

const DraggableModal = styled.div<{ isVisible: boolean; x: number; y: number }>`
  position: fixed;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  width: 600px;
  height: 700px;
  background: linear-gradient(135deg, #1a3a52 0%, #0d2a42 100%);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: ${props => props.isVisible ? 'flex' : 'none'};
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  }
`;

const ModalHeader = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderTitle = styled.h3`
  color: white;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DragIcon = styled(DragOutlined)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 0, 0, 0.3);
    transform: scale(1.1);
  }
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
`;

const PromptSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PromptLabel = styled.label`
  color: white;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledTextArea = styled(TextArea)`
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 12px !important;
  color: white !important;
  font-size: 14px;
  min-height: 120px !important;
  resize: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }
  
  &:focus {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
  }
`;

const SendButton = styled(Button)`
  background: linear-gradient(135deg, #1890ff, #096dd9) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(24, 144, 255, 0.4);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: none;
    box-shadow: none;
  }
`;

const ResponseSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
`;

const ResponseLabel = styled.label`
  color: white;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ResponseContent = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  color: white;
  font-size: 14px;
  line-height: 1.6;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  
  /* Style pour le markdown */
  h1, h2, h3, h4, h5, h6 {
    color: #1890ff;
    margin: 16px 0 8px 0;
    font-weight: 600;
  }
  
  h1 { font-size: 18px; }
  h2 { font-size: 16px; }
  h3 { font-size: 15px; }
  
  p {
    margin: 8px 0;
  }
  
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
  }
  
  strong {
    color: #52c41a;
    font-weight: 600;
  }
  
  em {
    color: #faad14;
    font-style: italic;
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

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  font-size: 14px;
`;

const QuickPrompts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const QuickPromptButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

// === INTERFACES ===

interface AIModalProps {
  isVisible: boolean;
  onClose: () => void;
  contextData?: any;
  contextType?: 'cout' | 'urgences';
}

interface AIResponse {
  analysis: string;
  recommendations: string[];
  insights: string[];
}

// === COMPONENT ===

export const AIModal: React.FC<AIModalProps> = ({ 
  isVisible, 
  onClose, 
  contextData, 
  contextType = 'cout' 
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Quick prompts selon le contexte
  const getQuickPrompts = () => {
    if (contextType === 'cout') {
      return [
        "Analyse les tendances de coûts de vaccination",
        "Quels sont les départements les plus coûteux ?",
        "Comment optimiser les coûts de vaccination ?",
        "Compare les scénarios de vaccination",
        "Recommandations pour réduire les coûts"
      ];
    } else {
      return [
        "Analyse les tendances des urgences grippe",
        "Quelles zones ont le plus d'urgences ?",
        "Comment prédire les pics d'urgences ?",
        "Recommandations pour réduire les urgences",
        "Corrélation vaccination vs urgences"
      ];
    }
  };

  // Gestion du drag & drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Limiter aux bords de l'écran
        const maxX = window.innerWidth - 500;
        const maxY = window.innerHeight - 600;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      message.warning('Veuillez saisir une question');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      const requestBody = {
        prompt: prompt,
        context_data: contextData,
        context_type: contextType
      };

      const response = await fetch('http://localhost:8000/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse IA');
      }

      const data = await response.json();
      console.log('Réponse IA reçue:', data); // Debug
      
      // Essayer différentes propriétés possibles pour la réponse
      const analysisText = data.analysis || data.response || data.message || data.text || JSON.stringify(data);
      setResponse(analysisText);
      
    } catch (error) {
      console.error('Erreur IA:', error);
      setResponse('❌ Erreur lors de l\'analyse IA. Vérifiez que Ollama est démarré.');
      message.error('Erreur lors de l\'analyse IA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAnalyze();
    }
  };

  // Fonction pour convertir le markdown simple en HTML
  const formatResponse = (text: string) => {
    if (!text) return '';
    
    // Si c'est un JSON stringifié, essayer de le parser
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.analysis) {
          text = parsed.analysis;
        } else if (parsed.response) {
          text = parsed.response;
        }
      } catch (e) {
        // Garder le texte original si ce n'est pas du JSON valide
      }
    }
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|l])/gm, '<p>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/li><\/ul><ul><li>/g, '</li><li>')
      .replace(/<\/p><p><\/p>/g, '</p>')
      .replace(/<p><\/p>/g, '');
  };

  return (
    <DraggableModal
      ref={modalRef}
      isVisible={isVisible}
      x={position.x}
      y={position.y}
      onMouseDown={handleMouseDown}
    >
      <ModalHeader ref={headerRef}>
        <HeaderLeft>
          <DragIcon />
          <HeaderTitle>
            <RobotOutlined />
            Assistant IA
          </HeaderTitle>
        </HeaderLeft>
        <CloseButton onClick={onClose}>
          <CloseOutlined />
        </CloseButton>
      </ModalHeader>

      <ModalContent>
        <PromptSection>
          <PromptLabel>
            <BulbOutlined />
            Posez votre question
          </PromptLabel>
          <StyledTextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Analysez les données ${contextType === 'cout' ? 'de coûts' : 'd\'urgences'}...`}
            onKeyDown={handleKeyPress}
          />
          
          <QuickPrompts>
            {getQuickPrompts().map((quickPrompt, index) => (
              <QuickPromptButton
                key={index}
                onClick={() => handleQuickPrompt(quickPrompt)}
              >
                {quickPrompt}
              </QuickPromptButton>
            ))}
          </QuickPrompts>
        </PromptSection>

        <SendButton
          onClick={handleAnalyze}
          loading={isLoading}
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? <LoadingOutlined /> : <SendOutlined />}
          {isLoading ? 'Analyse en cours...' : 'Analyser avec IA'}
        </SendButton>

        {/* Bouton de debug temporaire */}
        {response && (
          <Button 
            size="small" 
            onClick={() => {
              console.log('Response state:', response);
              console.log('Response type:', typeof response);
              console.log('Response length:', response.length);
            }}
            style={{ marginBottom: '8px' }}
          >
            Debug Response
          </Button>
        )}

        <ResponseSection>
          <ResponseLabel>
            <ThunderboltOutlined />
            Analyse IA
          </ResponseLabel>
          <ResponseContent>
            {isLoading ? (
              <LoadingSpinner>
                <LoadingOutlined spin />
                L'IA analyse vos données...
              </LoadingSpinner>
            ) : response ? (
              <div>
                <div dangerouslySetInnerHTML={{ __html: formatResponse(response) }} />
                {response.length > 100 && (
                  <details style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px' }}>Voir la réponse brute</summary>
                    <pre style={{ fontSize: '11px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{response}</pre>
                  </details>
                )}
              </div>
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                Posez une question pour obtenir une analyse IA de vos données
              </div>
            )}
          </ResponseContent>
        </ResponseSection>
      </ModalContent>
    </DraggableModal>
  );
};
