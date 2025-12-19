import { ReactNode } from 'react';
import styled from 'styled-components';
import CloseIcon from './CloseIcon';
import Overlay from './Overlay';
import useEscClose from 'hooks/useEscKey';
import { media } from 'utils/media';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function EditModal({ isOpen, onClose, title, children }: EditModalProps) {
  useEscClose({ onClose });

  if (!isOpen) {
    return null;
  }

  return (
    <Overlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <Card>
          <CloseIconContainer>
            <CloseIcon onClick={onClose} />
          </CloseIconContainer>
          <Title>{title}</Title>
          {children}
        </Card>
      </Container>
    </Overlay>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
`;

const Card = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  margin: auto;
  padding: 4rem 5rem;
  background: rgb(var(--modalBackground));
  border-radius: 0.6rem;
  max-width: 80rem;
  max-height: 90vh;
  overflow-y: auto;
  color: rgb(var(--text));
  box-shadow: var(--shadow-lg);

  ${media('<=tablet')} {
    padding: 3rem 2rem;
    max-width: 95%;
  }
`;

const CloseIconContainer = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  cursor: pointer;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 3rem;
  color: rgb(var(--primary));
  text-align: center;

  ${media('<=tablet')} {
    font-size: 2.4rem;
    margin-bottom: 2rem;
  }
`;

