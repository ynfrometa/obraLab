import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { doc, updateDoc } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import { database } from 'lib/firebase';

interface Empresa {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  telefono2?: string;
  email?: string;
  fechaCreacion: number;
}

interface EditEmpresaFormProps {
  empresa: Empresa;
  onClose: () => void;
}

export default function EditEmpresaForm({ empresa, onClose }: EditEmpresaFormProps) {
  const [hasSuccessfullyUpdated, setHasSuccessfullyUpdated] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const { register, handleSubmit, formState, reset } = useForm<Empresa>({
    defaultValues: empresa,
  });
  const { isSubmitting, errors } = formState;

  useEffect(() => {
    reset(empresa);
  }, [empresa, reset]);

  async function onSubmit(payload: Empresa) {
    try {
      if (!database) {
        throw new Error('Firebase no está inicializado.');
      }
      const empresaDocRef = doc(database, 'empresas', empresa.id);
      await updateDoc(empresaDocRef, {
        nombre: payload.nombre,
        direccion: payload.direccion || '',
        telefono: payload.telefono || '',
        telefono2: payload.telefono2 || '',
        email: payload.email || '',
      });

      setHasSuccessfullyUpdated(true);
      setHasErrored(false);
      setTimeout(() => {
        setHasSuccessfullyUpdated(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
      setHasErrored(true);
    }
  }

  const isDisabled = isSubmitting;
  const isSubmitDisabled = Object.keys(errors).length > 0 || isDisabled;

  return (
    <Wrapper>
      {hasSuccessfullyUpdated && <SuccessMessage>✓ Empresa actualizada correctamente</SuccessMessage>}
      {hasErrored && <ErrorMessage>Error al actualizar empresa. Por favor, intenta de nuevo.</ErrorMessage>}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputGroup>
          <InputStack>
            {errors.nombre && <ErrorMessage>El nombre es requerido</ErrorMessage>}
            <StyledInput
              placeholder="Nombre de la empresa *"
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
              type="tel"
              placeholder="Teléfono 2 (opcional)"
              id="telefono2"
              disabled={isDisabled}
              {...register('telefono2')}
            />
          </InputStack>
        </InputGroup>
        <InputGroup>
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
        <ButtonGroup>
          <Button as="button" type="button" transparent onClick={onClose}>
            Cancelar
          </Button>
          <Button as="button" type="submit" disabled={isSubmitDisabled}>
            Guardar Cambios
          </Button>
        </ButtonGroup>
      </Form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  padding-top: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
  margin-top: 3rem;

  ${media('<=phone')} {
    flex-direction: column;
    gap: 1rem;
  }
`;




