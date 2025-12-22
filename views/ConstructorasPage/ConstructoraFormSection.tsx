import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { collection, addDoc } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import SectionTitle from 'components/SectionTitle';
import { database } from 'lib/firebase';

interface ConstructoraPayload {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

interface ConstructoraFormSectionProps {
  onSuccess?: () => void;
}

export default function ConstructoraFormSection({ onSuccess }: ConstructoraFormSectionProps) {
  const [hasSuccessfullyAdded, setHasSuccessfullyAdded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register, handleSubmit, formState, reset } = useForm();
  const { isSubmitting, errors } = formState;

  async function onSubmit(payload: ConstructoraPayload) {
    try {
      setHasErrored(false);
      setErrorMessage('');

      if (!database) {
        throw new Error('Firebase no está inicializado.');
      }

      const newConstructora = {
        ...payload,
        fechaCreacion: new Date().getTime(),
      };

      const constructorasCollection = collection(database, 'constructoras');
      await addDoc(constructorasCollection, newConstructora);

      setHasSuccessfullyAdded(true);
      reset();

      setTimeout(() => {
        setHasSuccessfullyAdded(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error al añadir constructora:', error);
      const errorMsg = error?.message || error?.code || 'Error desconocido al conectar con Firebase';
      setErrorMessage(errorMsg);
      setHasErrored(true);
      
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        setErrorMessage(
          `⚠️ ERROR DE PERMISOS: Necesitas configurar las reglas de Firestore.
          Ve a Firebase Console → Firestore Database → Rules y configura:
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /constructoras/{document=**} {
                allow read, write: if true;
              }
            }
          }`
        );
      }
      
      setTimeout(() => {
        setHasErrored(false);
        setErrorMessage('');
      }, 5000);
    }
  }

  const isDisabled = isSubmitting;
  const isSubmitDisabled = Object.keys(errors).length > 0 || isDisabled;

  return (
    <Wrapper>
      <FormHeader>
        <SectionTitle>Añadir Nueva Constructora</SectionTitle>
        {onSuccess && (
          <CloseButton onClick={onSuccess} type="button">
            ×
          </CloseButton>
        )}
      </FormHeader>
      {hasSuccessfullyAdded && <SuccessMessage>✓ Constructora añadida correctamente</SuccessMessage>}
      {hasErrored && <ErrorMessage>{errorMessage}</ErrorMessage>}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputGroup>
          <InputStack>
            {errors.nombre && <ErrorMessage>El nombre es requerido</ErrorMessage>}
            <StyledInput
              placeholder="Nombre de la constructora *"
              id="nombre"
              disabled={isDisabled}
              {...register('nombre', { required: true })}
            />
          </InputStack>
          <InputStack>
            <StyledInput
              placeholder="Dirección (opcional)"
              id="direccion"
              disabled={isDisabled}
              {...register('direccion')}
            />
          </InputStack>
        </InputGroup>
        <InputGroup>
          <InputStack>
            <StyledInput
              type="tel"
              placeholder="Teléfono (opcional)"
              id="telefono"
              disabled={isDisabled}
              {...register('telefono')}
            />
          </InputStack>
          <InputStack>
            <StyledInput
              type="email"
              placeholder="Email (opcional)"
              id="email"
              disabled={isDisabled}
              {...register('email')}
            />
          </InputStack>
        </InputGroup>
        <Button as="button" type="submit" disabled={isSubmitDisabled}>
          Añadir Constructora
        </Button>
      </Form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const InputGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  margin-bottom: 1.2rem;

  & > * {
    flex: 1;
  }

  ${media('<=tablet')} {
    flex-direction: column;
    gap: 1.2rem;
    margin-bottom: 1.2rem;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const InputStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledInput = styled(Input)`
  font-size: 1.4rem;
  padding: 1rem 1.2rem;
  border: 2px solid rgba(var(--text), 0.25);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: rgb(var(--errorColor));
  font-size: 1.4rem;
  margin: 0;
  padding: 0.5rem 0;
`;

const SuccessMessage = styled.p`
  color: rgb(34, 197, 94);
  font-size: 1.4rem;
  font-weight: bold;
  padding: 1rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 0.6rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 2rem;
`;

const CloseButton = styled.button`
  background: rgb(var(--errorColor));
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.1);
  }
`;

