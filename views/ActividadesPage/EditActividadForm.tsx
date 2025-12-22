import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { doc, updateDoc } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import { database } from 'lib/firebase';

interface Actividad {
  id: string;
  descripcion: string;
  fechaCreacion: number;
}

interface EditActividadFormProps {
  actividad: Actividad;
  onClose: () => void;
}

export default function EditActividadForm({ actividad, onClose }: EditActividadFormProps) {
  const [hasSuccessfullyUpdated, setHasSuccessfullyUpdated] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const { register, handleSubmit, formState, reset } = useForm<Actividad>({
    defaultValues: actividad,
  });
  const { isSubmitting, errors } = formState;

  useEffect(() => {
    reset(actividad);
  }, [actividad, reset]);

  async function onSubmit(payload: Actividad) {
    try {
      if (!database) {
        throw new Error('Firebase no está inicializado.');
      }
      const actividadDocRef = doc(database, 'actividades', actividad.id);
      await updateDoc(actividadDocRef, {
        descripcion: payload.descripcion,
      });

      setHasSuccessfullyUpdated(true);
      setHasErrored(false);
      setTimeout(() => {
        setHasSuccessfullyUpdated(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al actualizar actividad:', error);
      setHasErrored(true);
    }
  }

  const isDisabled = isSubmitting;
  const isSubmitDisabled = Object.keys(errors).length > 0 || isDisabled;

  return (
    <Wrapper>
      {hasSuccessfullyUpdated && <SuccessMessage>✓ Actividad actualizada correctamente</SuccessMessage>}
      {hasErrored && <ErrorMessage>Error al actualizar actividad. Por favor, intenta de nuevo.</ErrorMessage>}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputStack>
          {errors.descripcion && <ErrorMessage>La descripción es requerida</ErrorMessage>}
          <StyledInput
            type="text"
            placeholder="Descripción *"
            id="descripcion"
            disabled={isDisabled}
            {...register('descripcion', { 
              required: 'La descripción es requerida',
              minLength: {
                value: 1,
                message: 'La descripción debe tener al menos un carácter'
              }
            })}
          />
        </InputStack>
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

const InputStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.2rem;

  &:last-child {
    margin-bottom: 0;
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

const StyledInput = styled(Input)`
  width: 100%;
  font-size: 1.4rem;
  padding: 1rem 1.2rem;
  border: 2px solid rgba(var(--text), 0.25);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;

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

