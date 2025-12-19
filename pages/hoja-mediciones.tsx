import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import MedicionFormSection from 'views/MedicionesPage/MedicionFormSection';
import MedicionesListSection from 'views/MedicionesPage/MedicionesListSection';

export default function HojaMedicionesPage() {
  return (
    <Page title="Hoja de Mediciones" description="Gestiona y añade hojas de mediciones de obra.">
      <MedicionesContainer>
        <MedicionFormSection />
        <MedicionesListSection />
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

