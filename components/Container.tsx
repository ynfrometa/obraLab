import styled from 'styled-components';
import { media } from 'utils/media';

const Container = styled.div`
  position: relative;
  max-width: 130em;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;

  ${media('<=tablet')} {
    padding: 0 1.5rem;
  }

  ${media('<=phone')} {
    padding: 0 1rem;
  }
`;

export default Container;
