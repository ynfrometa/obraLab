import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import WorkerFormSection from 'views/WorkersPage/WorkerFormSection';
import WorkersListSection from 'views/WorkersPage/WorkersListSection';

export default function WorkersPage() {
  return (
    <Page title="Trabajadores" description="Gestiona y añade trabajadores a tu equipo.">
      <WorkersContainer>
        <WorkerFormSection />
        <WorkersListSection />
      </WorkersContainer>
    </Page>
  );
}

const WorkersContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;

