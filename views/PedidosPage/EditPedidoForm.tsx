import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import { database } from 'lib/firebase';

interface Pedido {
  id: string;
  fecha: string;
  descripcion: string;
  cantidad: string;
  costo: string;
  constructora: string;
  obra: string;
  empresa: string;
  proveedor: string;
  trabajador: string;
  fechaCreacion?: number;
}

interface EditPedidoFormProps {
  pedido: Pedido;
  onSave: (data: Partial<Pedido>) => void;
  onCancel: () => void;
}

export default function EditPedidoForm({ pedido, onSave, onCancel }: EditPedidoFormProps) {
  const [constructorasList, setConstructorasList] = useState<any[]>([]);
  const [obrasList, setObrasList] = useState<any[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [trabajadoresList, setTrabajadoresList] = useState<any[]>([]);

  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      fecha: pedido.fecha,
      descripcion: pedido.descripcion,
      cantidad: pedido.cantidad,
      costo: pedido.costo,
      constructora: pedido.constructora,
      obra: pedido.obra,
      empresa: pedido.empresa,
      proveedor: pedido.proveedor,
      trabajador: pedido.trabajador,
    },
  });
  const { errors, isSubmitting } = formState;

  // Cargar lista de constructoras
  useEffect(() => {
    const loadConstructoras = async () => {
      if (!database) return;
      try {
        const constructorasCollection = collection(database, 'constructoras');
        const constructorasQuery = query(constructorasCollection, orderBy('nombre', 'asc'));
        const snapshot = await getDocs(constructorasQuery);
        const constructoras = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setConstructorasList(constructoras);
      } catch (error) {
        console.error('Error al cargar constructoras:', error);
      }
    };
    loadConstructoras();
  }, []);

  // Cargar lista de obras
  useEffect(() => {
    const loadObras = async () => {
      if (!database) return;
      try {
        const obrasCollection = collection(database, 'obras');
        const snapshot = await getDocs(obrasCollection);
        const obras = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setObrasList(obras);
      } catch (error) {
        console.error('Error al cargar obras:', error);
      }
    };
    loadObras();
  }, []);

  // Cargar lista de empresas
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

  // Cargar lista de trabajadores
  useEffect(() => {
    const loadTrabajadores = async () => {
      if (!database) return;
      try {
        const workersCollection = collection(database, 'workers');
        const workersQuery = query(workersCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(workersQuery);
        const workers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrabajadoresList(workers);
      } catch (error) {
        console.error('Error al cargar trabajadores:', error);
      }
    };
    loadTrabajadores();
  }, []);

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <InputGroup>
        <InputStack>
          {errors.fecha && <ErrorMessage>La fecha es requerida</ErrorMessage>}
          <StyledInput
            type="date"
            placeholder="Fecha *"
            id="fecha"
            disabled={isSubmitting}
            {...register('fecha', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.descripcion && <ErrorMessage>La descripción es requerida</ErrorMessage>}
          <StyledInput
            placeholder="Descripción *"
            id="descripcion"
            disabled={isSubmitting}
            {...register('descripcion', { required: true })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.cantidad && <ErrorMessage>La cantidad es requerida</ErrorMessage>}
          <StyledInput
            type="number"
            placeholder="Cantidad *"
            id="cantidad"
            disabled={isSubmitting}
            {...register('cantidad', { required: true, min: 0 })}
          />
        </InputStack>
        <InputStack>
          {errors.costo && <ErrorMessage>El costo es requerido</ErrorMessage>}
          <StyledInput
            type="number"
            step="0.01"
            placeholder="Costo *"
            id="costo"
            disabled={isSubmitting}
            {...register('costo', { required: true, min: 0 })}
          />
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.constructora && <ErrorMessage>La constructora es requerida</ErrorMessage>}
          {constructorasList.length > 0 ? (
            <SelectInput
              id="constructora"
              disabled={isSubmitting}
              {...register('constructora', { required: true })}
            >
              <option value="">Selecciona una constructora</option>
              {constructorasList.map((constructora) => (
                <option key={constructora.id} value={constructora.nombre}>
                  {constructora.nombre}
                </option>
              ))}
            </SelectInput>
          ) : (
            <StyledInput
              placeholder="Constructora *"
              id="constructora"
              disabled={isSubmitting}
              {...register('constructora', { required: true })}
            />
          )}
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.obra && <ErrorMessage>La obra es requerida</ErrorMessage>}
          {obrasList.length > 0 ? (
            <SelectInput
              id="obra"
              disabled={isSubmitting}
              {...register('obra', { required: true })}
            >
              <option value="">Selecciona una obra</option>
              {obrasList.map((obra) => {
                const empresaTexto = Array.isArray(obra.empresa) 
                  ? obra.empresa.filter(Boolean).join(',')
                  : obra.empresa || '';
                const empresaDisplay = Array.isArray(obra.empresa) 
                  ? obra.empresa.filter(Boolean).join(', ')
                  : obra.empresa || '';
                
                return (
                  <option key={obra.id} value={empresaTexto}>
                    {obra.descripcion || obra.id} - {empresaDisplay}
                  </option>
                );
              })}
            </SelectInput>
          ) : (
            <StyledInput
              placeholder="Obra *"
              id="obra"
              disabled={isSubmitting}
              {...register('obra', { required: true })}
            />
          )}
        </InputStack>
        <InputStack>
          {errors.empresa && <ErrorMessage>La empresa es requerida</ErrorMessage>}
          {empresasList.length > 0 ? (
            <SelectInput
              id="empresa"
              disabled={isSubmitting}
              {...register('empresa', { required: true })}
            >
              <option value="">Selecciona una empresa</option>
              {empresasList.map((empresa) => (
                <option key={empresa.id} value={empresa.nombre}>
                  {empresa.nombre}
                </option>
              ))}
            </SelectInput>
          ) : (
            <StyledInput
              placeholder="Empresa *"
              id="empresa"
              disabled={isSubmitting}
              {...register('empresa', { required: true })}
            />
          )}
        </InputStack>
      </InputGroup>
      <InputGroup>
        <InputStack>
          {errors.proveedor && <ErrorMessage>El proveedor es requerido</ErrorMessage>}
          <StyledInput
            placeholder="Proveedor *"
            id="proveedor"
            disabled={isSubmitting}
            {...register('proveedor', { required: true })}
          />
        </InputStack>
        <InputStack>
          {errors.trabajador && <ErrorMessage>El trabajador es requerido</ErrorMessage>}
          {trabajadoresList.length > 0 ? (
            <SelectInput
              id="trabajador"
              disabled={isSubmitting}
              {...register('trabajador', { required: true })}
            >
              <option value="">Selecciona un trabajador</option>
              {trabajadoresList.map((trabajador) => (
                <option key={trabajador.id} value={trabajador.name}>
                  {trabajador.name} {trabajador.alias ? `(${trabajador.alias})` : ''}
                </option>
              ))}
            </SelectInput>
          ) : (
            <StyledInput
              placeholder="Trabajador *"
              id="trabajador"
              disabled={isSubmitting}
              {...register('trabajador', { required: true })}
            />
          )}
        </InputStack>
      </InputGroup>
      <ButtonGroup>
        <Button as="button" type="submit" disabled={isSubmitting}>
          Guardar Cambios
        </Button>
        <Button as="button" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
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
  font-size: 1.3rem;
  padding: 0.9rem 1rem;
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

const SelectInput = styled.select`
  border: 2px solid rgba(var(--text), 0.25);
  background: rgb(var(--inputBackground));
  border-radius: 0.5rem;
  font-size: 1.3rem;
  padding: 0.9rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: rgb(var(--text));
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;

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
  gap: 1rem;
  margin-top: 1rem;

  ${media('<=tablet')} {
    flex-direction: column;
  }
`;





