import { useState } from 'react';
import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import ConstructoraFormSection from 'views/ConstructorasPage/ConstructoraFormSection';
import ConstructorasListSection from 'views/ConstructorasPage/ConstructorasListSection';

export default function ConstructorasPage() {
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };

  return (
    <Page title="Constructoras" description="Gestiona y añade constructoras.">
      <ConstructorasContainer>
        {showForm && <ConstructoraFormSection onSuccess={handleHideForm} />}
        <ConstructorasListSection onShowForm={handleShowForm} />
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


