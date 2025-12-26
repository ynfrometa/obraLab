import { useState } from 'react';
import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import PedidoFormSection from 'views/PedidosPage/PedidoFormSection';
import PedidosListSection from 'views/PedidosPage/PedidosListSection';

export default function PedidosPage() {
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };

  return (
    <Page title="Hoja de Pedidos" description="Gestiona y añade hojas de pedidos.">
      <PedidosContainer>
        {showForm && <PedidoFormSection onSuccess={handleHideForm} />}
        <PedidosListSection onShowForm={handleShowForm} />
      </PedidosContainer>
    </Page>
  );
}

const PedidosContainer = styled.div`
  display: flex;
  gap: 4rem;
  flex-direction: column;

  ${media('<=tablet')} {
    gap: 2rem;
  }
`;




