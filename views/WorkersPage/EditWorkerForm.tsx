import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';

interface Worker {
  id: string;
  name: string;
  alias: string;
  address: string;
  phoneNumber: string;
  job: string;
  company: string;
  workStatus: string;
  hireDate: number;
}

interface EditWorkerFormProps {
  worker: Worker;
  onSave: (data: Partial<Worker>) => void;
  onCancel: () => void;
}

export default function EditWorkerForm({ worker, onSave, onCancel }: EditWorkerFormProps) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      name: worker.name,
      alias: worker.alias,
      address: worker.address,
      phoneNumber: worker.phoneNumber,
      job: worker.job,
      company: worker.company,
      workStatus: worker.workStatus,
    },
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <InputGroup>
        <InputStack>
          {errors.name && <ErrorMessage>El nombre es requerido</ErrorMessage>}
          <StyledInput
            placeholder="Nombre *"
            id="name"
            disabled={isSubmitting}
            {...register('name', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.alias && <ErrorMessage>El alias es requerido</ErrorMessage>}
          <StyledInput
            placeholder="Alias *"
            id="alias"
            disabled={isSubmitting}
            {...register('alias', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.address && <ErrorMessage>La dirección es requerida</ErrorMessage>}
          <StyledInput
            placeholder="Dirección *"
            id="address"
            disabled={isSubmitting}
            {...register('address', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.phoneNumber && <ErrorMessage>El teléfono es requerido</ErrorMessage>}
          <StyledInput
            type="tel"
            placeholder="Teléfono *"
            id="phoneNumber"
            disabled={isSubmitting}
            {...register('phoneNumber', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.job && <ErrorMessage>El puesto de trabajo es requerido</ErrorMessage>}
          <StyledInput
            placeholder="Puesto de trabajo *"
            id="job"
            disabled={isSubmitting}
            {...register('job', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.company && <ErrorMessage>La empresa es requerida</ErrorMessage>}
          <StyledInput
            placeholder="Empresa *"
            id="company"
            disabled={isSubmitting}
            {...register('company', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputStack>
        {errors.workStatus && <ErrorMessage>El estado laboral es requerido</ErrorMessage>}
        <SelectInput
          id="workStatus"
          disabled={isSubmitting}
          {...register('workStatus', { required: true })}
        >
          <option value="">Selecciona un estado</option>
          <option value="contratado">Contratado</option>
          <option value="despedido">Despedido</option>
        </SelectInput>
      </InputStack>
      <ButtonGroup>
        <Button as="button" type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <CancelButton as="button" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </CancelButton>
      </ButtonGroup>
    </Form>
  );
}

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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  justify-content: flex-end;

  ${media('<=tablet')} {
    flex-direction: column;
  }
`;

const CancelButton = styled(Button)`
  background: transparent;
  border: 2px solid rgb(var(--primary));
  color: rgb(var(--primary));

  &:hover {
    background: rgba(var(--primary), 0.1);
  }
`;

const SelectInput = styled.select`
  border: 2px solid rgba(var(--text), 0.25);
  background: rgb(var(--inputBackground));
  border-radius: 0.5rem;
  font-size: 1.4rem;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: rgb(var(--text));
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

