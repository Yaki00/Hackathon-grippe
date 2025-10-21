import styled from 'styled-components';
import { Card } from './Card';

interface TestProps {
	title: string;
	content: string;
	data: {
		zoneA: number;
		zoneB: number;
		zoneC: number;
	},
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
display: ${props => props.type === 'table' ? 'block' : 'grid'};
grid-template-columns: ${props => props.type === 'table' ? 'none' : 'repeat(3, 1fr)'};
gap: ${props => props.type === 'table' ? '0' : '20px'};
`;

export const DisplayData = ({ title, content, data, type,children }: TestProps) => {

	
	return (
		<Container>
			<Title>{title}</Title>
			<Subtitle>{content}</Subtitle>
			<Content type={type}>
				{children}
				{/* <Card title="Zone A" rate="55" content="vaccination rate" data={data.zoneA} />
				<Card title="Zone B" rate="70" content="vaccination rate" data={data.zoneB} />
				<Card title="Zone C" rate="85" content="vaccination rate" data={data.zoneC} /> */}
			</Content>
		</Container>
	);
};