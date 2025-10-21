import styled from "styled-components"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ['#4391ce', '#1e3e54'];



const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #1c374a;
  color: white;
  gap: 10px;
`;

const CardTitle = styled.h3`
  margin: 0;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
`;

interface CardProps {
  title: string;
  rate: number;
  content: string;
  vaccinatedRate: number;
  objectif: number;
}

const Rate = styled.span`
  font-size: 24px;
  font-weight: bold;
  color: white;
`;

const ContentText = styled.span`
  font-size: 16px;
  color: #768191;
`;

const PieWrapper = styled.div`
  width: 100%;
  height: 200px;
`;

export const Card = ({ title, rate, content, vaccinatedRate, objectif }: CardProps) => {
	const formatData = [
		{ name: 'Vaccinated', value: vaccinatedRate },
		{ name: 'Unvaccinated', value: objectif - vaccinatedRate },
	];

  return (
    <CardWrapper>
      <CardTitle>{title}</CardTitle>
      <CardContent>
		<Rate>{rate}%</Rate>
		<ContentText>{content}</ContentText>
		<PieWrapper style={{ height: 120 }}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={formatData}
						innerRadius={40}
						outerRadius={55}
						startAngle={90}
						endAngle={-270}
						dataKey="value"
						stroke="none"
						paddingAngle={0}
					>
						{formatData.map((item, index) => (
							<Cell key={`cell-${index}`} fill={COLORS[index]} />
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
		</PieWrapper>
	  </CardContent>
    </CardWrapper>
  );
};