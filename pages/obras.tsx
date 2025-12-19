import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import ObraFormSection from 'views/ObrasPage/ObraFormSection';
import ObrasListSection from 'views/ObrasPage/ObrasListSection';

export default function ObrasPage() {
  return (
    <Page title="Obras" description="Gestiona y añade obras de construcción.">
      <ObrasContainer>
        <ObraFormSection />
        <ObrasListSection />
      </ObrasContainer>
    </Page>
  );
}

const ObrasContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;

