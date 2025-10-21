import styled from 'styled-components';
import { Card } from './Card';
import type { VaccinationByZone } from '../entities/VaccinationByZone';

interface DisplayDataProps {
	title: string;
	content: string;
	type: string;
	children: React.ReactNode;
}

const Container = styled.div`
display: flex;
flex-direction: column;
gap: 10px;
`;

const Title = styled.h2`
	margin: 0;
`;

const Subtitle = styled.p`
	margin: 0;
  color: #768191;

`;

const Content = styled.div<{type?: string}>`
display: ${props => props.type === 'table' ? 'block' : props.type === 'card' ? 'block' : 'grid'};
grid-template-columns: ${props => props.type === 'table' ? 'none' : props.type === 'card' ? 'none' : 'repeat(3, 1fr)'};
gap: ${props => props.type === 'table' ? '0' : props.type === 'card' ? '0' : '20px'};
`;

export const DisplayData = ({ title, content, type, children }: DisplayDataProps) => {

	
	return (
		<Container>
			<Title>{title}</Title>
			<Subtitle>{content}</Subtitle>
			<Content type={type}>
				{children}
			</Content>
		</Container>
	);
};