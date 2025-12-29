import styled from 'styled-components';
import Page from 'components/Page';
import { media } from 'utils/media';
import EmpresaFormSection from 'views/EmpresasPage/EmpresaFormSection';
import EmpresasListSection from 'views/EmpresasPage/EmpresasListSection';

export default function EmpresasPage() {
  return (
    <Page title="Empresas" description="Gestiona y añade empresas.">
      <EmpresasContainer>
        <EmpresaFormSection />
        <EmpresasListSection />
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
