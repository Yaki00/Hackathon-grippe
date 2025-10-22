import styled from "styled-components";
import { Card } from "./Card";
import type { VaccinationByZone } from "../entities/VaccinationByZone";

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
padding: 20px;
border-radius: 8px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin: 0;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #768191;

  max-width: 900px;
`;

const Content = styled.div<{ type?: string }>`
  display: ${(props) => (props.type === "table" ? "block" : "grid")};
  grid-template-columns: ${(props) =>
    props.type === "table" ? "none" : "repeat(3, 1fr)"};
  gap: ${(props) => (props.type === "table" ? "0" : "20px")};
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
