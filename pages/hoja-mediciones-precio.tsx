import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import MedicionesPreciosListSection from 'views/MedicionesPreciosPage/MedicionesPreciosListSection';

export default function HojaMedicionesPrecioPage() {
  return (
    <Page title="Hoja de Mediciones Precio" description="Gestiona y añade hojas de mediciones precio de obra.">
      <MedicionesContainer>
        <MedicionesPreciosListSection />
      </MedicionesContainer>
    </Page>
  );
}

const MedicionesContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;

