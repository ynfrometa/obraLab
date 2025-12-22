import { useState } from 'react';
import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import ObraFormSection from 'views/ObrasPage/ObraFormSection';
import ObrasListSection from 'views/ObrasPage/ObrasListSection';

export default function ObrasPage() {
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };

  return (
    <Page title="Obras" description="Gestiona y añade obras de construcción.">
      <ObrasContainer>
        {showForm && <ObraFormSection onSuccess={handleHideForm} />}
        <ObrasListSection onShowForm={handleShowForm} />
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

