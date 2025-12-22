import { useState } from 'react';
import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import WorkerFormSection from 'views/WorkersPage/WorkerFormSection';
import WorkersListSection from 'views/WorkersPage/WorkersListSection';

export default function WorkersPage() {
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };

  return (
    <Page title="Trabajadores" description="Gestiona y añade trabajadores a tu equipo.">
      <WorkersContainer>
        {showForm && <WorkerFormSection onSuccess={handleHideForm} />}
        <WorkersListSection onShowForm={handleShowForm} />
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

