import { useState } from 'react';
import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import EmpresaFormSection from 'views/EmpresasPage/EmpresaFormSection';
import EmpresasListSection from 'views/EmpresasPage/EmpresasListSection';

export default function EmpresasPage() {
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };

  return (
    <Page title="Empresas" description="Gestiona y añade empresas.">
      <EmpresasContainer>
        {showForm && <EmpresaFormSection onSuccess={handleHideForm} />}
        <EmpresasListSection onShowForm={handleShowForm} />
      </EmpresasContainer>
    </Page>
  );
}

const EmpresasContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;









