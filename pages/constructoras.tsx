import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import ConstructoraFormSection from 'views/ConstructorasPage/ConstructoraFormSection';
import ConstructorasListSection from 'views/ConstructorasPage/ConstructorasListSection';

export default function ConstructorasPage() {
  return (
    <Page title="Constructoras" description="Gestiona y añade constructoras.">
      <ConstructorasContainer>
        <ConstructoraFormSection />
        <ConstructorasListSection />
      </ConstructorasContainer>
    </Page>
  );
}

const ConstructorasContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;

