import { useState } from 'react';
import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import ActividadFormSection from 'views/ActividadesPage/ActividadFormSection';
import ActividadesListSection from 'views/ActividadesPage/ActividadesListSection';

export default function ActividadesPage() {
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };

  return (
    <Page title="Actividades" description="Gestiona y añade actividades.">
      <ActividadesContainer>
        {showForm && <ActividadFormSection onSuccess={handleHideForm} />}
        <ActividadesListSection onShowForm={handleShowForm} />
      </ActividadesContainer>
    </Page>
  );
}

const ActividadesContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;


