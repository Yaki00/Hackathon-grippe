import styled from 'styled-components';
import { Link, useLocation } from "react-router";
import { useState, useEffect } from 'react';

const ContainerMain = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 50px auto;
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.nav<{ $showLinks?: boolean }>`
position: sticky;
top: 0px;
width: 100%;
background-color: #121c21;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
z-index: 1000;
padding: 20px 40px;
transition: all 0.3s ease;
display: flex;
align-items: center;
h1{
	margin: 0;
	font-size: 14px;
}
`

const TitlePage = styled.h2`
	margin: 0;
	font-size: 40px;
`;

const ContainerHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  p{
	max-width: 500px;
	color: #95a0b3;
  }
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 40px;
	width: 100%;
	margin-top: 40px;
`


const UlStyle = styled.ul<{ $visible?: boolean }>`
	list-style: none;
	display: flex;
	gap: 20px;
	transition: opacity 0.3s ease, transform 0.3s ease;
	opacity: ${props => props.$visible ? 1 : 0};
	transform: translateY(${props => props.$visible ? '0' : '-10px'});
	pointer-events: ${props => props.$visible ? 'auto' : 'none'};
`

const UlItem = styled.li<{ $active?: boolean; $inHeader?: boolean }>`
	padding: ${props => props.$inHeader ? '0' : '10px 0'};
	border-bottom: ${props => props.$inHeader ? 'none' : '1px solid #768191'};
	width: fit-content;
	cursor: pointer;
	color: ${props => props.$active && props.$inHeader ? '#4391ce' : 'inherit'};
	transition: color 0.3s ease;
	font-size: 14px;
	&:hover{
		${props => props.$inHeader ? `
			color: #4391ce;
		` : `
			border-bottom-color: #2a5266;
		`}
	}
	${props => props.$active && !props.$inHeader && `
		border-bottom-color: #2a5266;
	`}
`;
	
const NavLinks = styled.div<{ $inHeader?: boolean }>`
margin-left: 40px;
	${props => props.$inHeader && `
		display: flex;
		gap: 20px;
	`}
`;

export const Layout = ({ children }: { children: React.ReactNode }) => {
	const location = useLocation();
	const [showLinksInHeader, setShowLinksInHeader] = useState(false);
	const [lastScrollY, setLastScrollY] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			
			if (currentScrollY > lastScrollY && currentScrollY > 200) {
				setShowLinksInHeader(true);
			} 
			else if (currentScrollY < lastScrollY) {
				setShowLinksInHeader(false);
			}
			
			setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		
		return () => window.removeEventListener('scroll', handleScroll);
	}, [lastScrollY]);

	return (
		<>
		<Header>
			<h1>Vision santé</h1>
			{showLinksInHeader && (
				<NavLinks $inHeader>
					<UlStyle $visible={showLinksInHeader}>
						<Link to="/" style={{color: "white", textDecoration: "none"}}>
							<UlItem $active={location.pathname === '/'} $inHeader>Général</UlItem>
						</Link>
						<Link to="/geographique" style={{color: "white", textDecoration: "none"}}>
							<UlItem $active={location.pathname === '/geographique'} $inHeader>Vue géographique</UlItem>
						</Link>
						<Link to="/urgence" style={{color: "white", textDecoration: "none"}}>
							<UlItem $active={location.pathname === '/urgence'} $inHeader>Urgence</UlItem>
						</Link>
						<Link to="/couts" style={{color: "white", textDecoration: "none"}}>
							<UlItem $active={location.pathname === '/couts'} $inHeader>Coûts</UlItem>
						</Link>
						
					</UlStyle>
				</NavLinks>
			)}
		</Header>
		<ContainerMain>
		<ContainerHeader>
			<TitlePage>Dashboard sur la vaccination</TitlePage>
			<p>Suivre, visualiser et prévoir les données relatives à la vaccination contre la grippe dans toute la France.</p>
			<div>
				<UlStyle $visible={!showLinksInHeader}>
					<Link to="/" style={{color: "white", textDecoration: "none"}}>
						<UlItem $active={location.pathname === '/'}>Général</UlItem>
					</Link>
					<Link to="/geographique" style={{color: "white", textDecoration: "none"}}>
						<UlItem $active={location.pathname === '/geographique'}>Vue géographique</UlItem>
					</Link>
					<Link to="/urgence" style={{color: "white", textDecoration: "none"}}>
						<UlItem $active={location.pathname === '/urgence'}>Urgence</UlItem>
					</Link>
					<Link to="/couts" style={{color: "white", textDecoration: "none"}}>
						<UlItem $active={location.pathname === '/couts'}>Coûts</UlItem>
					</Link>
				</UlStyle>
			</div>
		</ContainerHeader>
		<Content>
			{children}
		</Content>
		</ContainerMain>

		</>
	)
}