import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import { database } from 'lib/firebase';

interface Obra {
  id: string;
  empresa: string | string[];
  descripcion: string;
  constructora: string;
  encargado: string;
  encargadoTel: string;
  jefeObra: string;
  jefeObraTel: string;
  direccion: string;
  poblado: string;
  estado: string;
  fechaInicio: string;
  solicitud: string;
}

interface EditObraFormProps {
  obra: Obra;
  onSave: (data: Partial<Obra>) => void;
  onCancel: () => void;
}

export default function EditObraForm({ obra, onSave, onCancel }: EditObraFormProps) {
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState<string[]>(() => {
    return Array.isArray(obra.empresa) ? obra.empresa : (obra.empresa ? [obra.empresa] : []);
  });
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      descripcion: obra.descripcion,
      constructora: obra.constructora,
      encargado: obra.encargado,
      encargadoTel: obra.encargadoTel,
      jefeObra: obra.jefeObra,
      jefeObraTel: obra.jefeObraTel,
      direccion: obra.direccion,
      poblado: obra.poblado,
      estado: obra.estado,
      fechaInicio: obra.fechaInicio,
      solicitud: obra.solicitud,
    },
  });
  const { errors, isSubmitting } = formState;

  // Cargar lista de empresas para el selector
  useEffect(() => {
    const loadEmpresas = async () => {
      if (!database) return;
      try {
        const empresasCollection = collection(database, 'empresas');
        const empresasQuery = query(empresasCollection, orderBy('nombre', 'asc'));
        const snapshot = await getDocs(empresasQuery);
        const empresas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpresasList(empresas);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      }
    };

    loadEmpresas();
  }, []);

  const toggleEmpresa = (empresaNombre: string) => {
    const nuevasEmpresas = [...empresasSeleccionadas];
    const empresaIndex = nuevasEmpresas.indexOf(empresaNombre);
    
    if (empresaIndex > -1) {
      nuevasEmpresas.splice(empresaIndex, 1);
    } else {
      nuevasEmpresas.push(empresaNombre);
    }
    
    setEmpresasSeleccionadas(nuevasEmpresas);
  };

  const onSubmit = (data: any) => {
    onSave({
      ...data,
      empresa: empresasSeleccionadas,
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <InputStack>
        <Label>Empresas *</Label>
        {empresasList.length > 0 ? (
          <CheckboxContainer>
            {empresasList.map((empresa) => (
              <CheckboxLabel key={empresa.id}>
                <CheckboxInput
                  type="checkbox"
                  checked={empresasSeleccionadas.includes(empresa.nombre)}
                  onChange={() => toggleEmpresa(empresa.nombre)}
                  disabled={isSubmitting}
                />
                <CheckboxText>{empresa.nombre}</CheckboxText>
              </CheckboxLabel>
            ))}
          </CheckboxContainer>
        ) : (
          <EmptyState>No hay empresas disponibles</EmptyState>
        )}
        {empresasSeleccionadas.length === 0 && (
          <ErrorMessage>Debes seleccionar al menos una empresa</ErrorMessage>
        )}
      </InputStack>
      <InputStack>
        {errors.descripcion && <ErrorMessage>La descripción es requerida</ErrorMessage>}
        <Textarea
          as="textarea"
          placeholder="Descripción"
          id="descripcion"
          disabled={isSubmitting}
          {...register('descripcion', { required: true })}
        />
      </InputStack>
      <InputGroup>
        <InputStack>
          {errors.constructora && <ErrorMessage>La constructora es requerida</ErrorMessage>}
          <Input
            placeholder="Constructora"
            id="constructora"
            disabled={isSubmitting}
            {...register('constructora', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.estado && <ErrorMessage>El estado es requerido</ErrorMessage>}
          <SelectInput
            id="estado"
            disabled={isSubmitting}
            {...register('estado', { required: true })}
          >
            <option value="">Selecciona un estado</option>
            <option value="Contratacion">Contratacion</option>
            <option value="Contratada">Contratada</option>
            <option value="En Ejecucion">En Ejecucion</option>
            <option value="Terminada">Terminada</option>
          </SelectInput>
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.encargado && <ErrorMessage>El encargado es requerido</ErrorMessage>}
          <Input
            placeholder="Encargado"
            id="encargado"
            disabled={isSubmitting}
            {...register('encargado', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.encargadoTel && <ErrorMessage>El teléfono del encargado es requerido</ErrorMessage>}
          <Input
            type="tel"
            placeholder="Encargado (Tel)"
            id="encargadoTel"
            disabled={isSubmitting}
            {...register('encargadoTel', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.jefeObra && <ErrorMessage>El jefe de obra es requerido</ErrorMessage>}
          <Input
            placeholder="Jefe de obra"
            id="jefeObra"
            disabled={isSubmitting}
            {...register('jefeObra', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.jefeObraTel && <ErrorMessage>El teléfono del jefe de obra es requerido</ErrorMessage>}
          <Input
            type="tel"
            placeholder="Jefe de obra (Tel)"
            id="jefeObraTel"
            disabled={isSubmitting}
            {...register('jefeObraTel', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.direccion && <ErrorMessage>La dirección es requerida</ErrorMessage>}
          <Input
            placeholder="Dirección"
            id="direccion"
            disabled={isSubmitting}
            {...register('direccion', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.poblado && <ErrorMessage>El poblado es requerido</ErrorMessage>}
          <Input
            placeholder="Poblado"
            id="poblado"
            disabled={isSubmitting}
            {...register('poblado', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.fechaInicio && <ErrorMessage>La fecha de inicio es requerida</ErrorMessage>}
          <Input
            type="date"
            placeholder="Fecha Inicio"
            id="fechaInicio"
            disabled={isSubmitting}
            {...register('fechaInicio', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.solicitud && <ErrorMessage>La solicitud es requerida</ErrorMessage>}
          <Input
            placeholder="Solicitud"
            id="solicitud"
            disabled={isSubmitting}
            {...register('solicitud', { required: true })}
          />
        </InputStack>
      </InputGroup>
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
  gap: 2rem;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  & > * {
    flex: 1;
  }

  ${media('<=tablet')} {
    flex-direction: column;
    gap: 0;
    & > *:first-child {
      margin-bottom: 2rem;
    }
  }
`;

const InputStack = styled.div`
  display: flex;
  flex-direction: column;

  & > *:not(:first-child) {
    margin-top: 0.5rem;
  }
`;

const ErrorMessage = styled.p`
  color: rgb(var(--errorColor));
  font-size: 1.5rem;
`;

const Textarea = styled(Input)`
  width: 100%;
  min-height: 10rem;
  resize: vertical;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1rem;

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
  border: 1px solid rgb(var(--inputBackground));
  background: rgb(var(--inputBackground));
  border-radius: 0.6rem;
  font-size: 1.6rem;
  padding: 1.8rem;
  box-shadow: var(--shadow-md);
  color: rgb(var(--text));

  &:focus {
    outline: none;
    box-shadow: var(--shadow-lg);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Label = styled.label`
  font-weight: bold;
  font-size: 1.4rem;
  color: rgb(var(--text));
  opacity: 0.8;
  margin-bottom: 1rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(var(--text), 0.05);
  border-radius: 0.6rem;
  border: 1px solid rgba(var(--text), 0.1);
  max-height: 20rem;
  overflow-y: auto;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.4rem;
  transition: background 0.2s;

  &:hover {
    background: rgba(var(--primary), 0.1);
  }
`;

const CheckboxInput = styled.input`
  width: 1.8rem;
  height: 1.8rem;
  cursor: pointer;
  accent-color: rgb(var(--primary));

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CheckboxText = styled.span`
  font-size: 1.5rem;
  color: rgb(var(--text));
`;

const EmptyState = styled.p`
  text-align: center;
  padding: 2rem;
  color: rgba(var(--text), 0.6);
  font-size: 1.5rem;
  background: rgba(var(--text), 0.05);
  border-radius: 0.6rem;
  border: 2px dashed rgba(var(--text), 0.2);
`;

