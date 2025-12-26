import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import SectionTitle from 'components/SectionTitle';
import { database } from 'lib/firebase';

interface PedidoPayload {
  fecha: string;
  descripcion: string;
  cantidad: string;
  costo: string;
  constructora: string;
  obra: string;
  empresa: string;
  proveedor: string;
  trabajador: string;
}

interface PedidoFormSectionProps {
  onSuccess?: () => void;
}

export default function PedidoFormSection({ onSuccess }: PedidoFormSectionProps) {
  const [hasSuccessfullyAdded, setHasSuccessfullyAdded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [constructorasList, setConstructorasList] = useState<any[]>([]);
  const [obrasList, setObrasList] = useState<any[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [trabajadoresList, setTrabajadoresList] = useState<any[]>([]);
  
  const { register, handleSubmit, formState, reset } = useForm<PedidoPayload>();
  const { isSubmitting, errors } = formState;

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

  async function onSubmit(payload: PedidoPayload) {
    try {
      setHasErrored(false);
      setErrorMessage('');

      if (!database) {
        throw new Error('Firebase no está inicializado.');
      }

      const newPedido = {
        ...payload,
        fechaCreacion: new Date().getTime(),
      };

      const pedidosCollection = collection(database, 'pedidos');
      await addDoc(pedidosCollection, newPedido);

      setHasSuccessfullyAdded(true);
      reset();

      setTimeout(() => {
        setHasSuccessfullyAdded(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error al añadir pedido:', error);
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
              match /pedidos/{document=**} {
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
        <SectionTitle>Añadir Nueva Hoja de Pedidos</SectionTitle>
        {onSuccess && (
          <CloseButton onClick={onSuccess} type="button">
            ×
          </CloseButton>
        )}
      </FormHeader>
      {hasSuccessfullyAdded && <SuccessMessage>✓ Hoja de pedidos añadida correctamente</SuccessMessage>}
      {hasErrored && <ErrorMessage>{errorMessage}</ErrorMessage>}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputGroup>
          <InputStack>
            {errors.fecha && <ErrorMessage>La fecha es requerida</ErrorMessage>}
            <StyledInput
              type="date"
              placeholder="Fecha *"
              id="fecha"
              disabled={isDisabled}
              {...register('fecha', { required: true })}
            />
          </InputStack>
          <InputStack>
            {errors.descripcion && <ErrorMessage>La descripción es requerida</ErrorMessage>}
            <StyledInput
              placeholder="Descripción *"
              id="descripcion"
              disabled={isDisabled}
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
              disabled={isDisabled}
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
              disabled={isDisabled}
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
                disabled={isDisabled}
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
                disabled={isDisabled}
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
                disabled={isDisabled}
                {...register('obra', { required: true })}
              >
                <option value="">Selecciona una obra</option>
                {obrasList.map((obra) => {
                  // Formatear empresa: si es array, unir con comas; si es string, usar directamente
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
                disabled={isDisabled}
                {...register('obra', { required: true })}
              />
            )}
          </InputStack>
          <InputStack>
            {errors.empresa && <ErrorMessage>La empresa es requerida</ErrorMessage>}
            {empresasList.length > 0 ? (
              <SelectInput
                id="empresa"
                disabled={isDisabled}
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
                disabled={isDisabled}
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
              disabled={isDisabled}
              {...register('proveedor', { required: true })}
            />
          </InputStack>
          <InputStack>
            {errors.trabajador && <ErrorMessage>El trabajador es requerido</ErrorMessage>}
            {trabajadoresList.length > 0 ? (
              <SelectInput
                id="trabajador"
                disabled={isDisabled}
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
                disabled={isDisabled}
                {...register('trabajador', { required: true })}
              />
            )}
          </InputStack>
        </InputGroup>
        <Button as="button" type="submit" disabled={isSubmitDisabled}>
          Añadir Hoja de Pedidos
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

const SelectInput = styled.select`
  border: 2px solid rgba(var(--text), 0.25);
  background: rgb(var(--inputBackground));
  border-radius: 0.5rem;
  font-size: 1.4rem;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: rgb(var(--text));
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;

  ${media('<=phone')} {
    font-size: 1.3rem;
    padding: 0.9rem 1rem;
  }

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




