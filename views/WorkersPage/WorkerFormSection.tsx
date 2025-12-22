import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { collection, addDoc, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import SectionTitle from 'components/SectionTitle';
import { database } from 'lib/firebase';

interface WorkerPayload {
  name: string;
  alias: string;
  address: string;
  phoneNumber: string;
  job: string;
  company: string;
  workStatus: string;
}

interface WorkerFormSectionProps {
  onSuccess?: () => void;
}

export default function WorkerFormSection({ onSuccess }: WorkerFormSectionProps) {
  const [hasSuccessfullyAdded, setHasSuccessfullyAdded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const { register, handleSubmit, formState, reset } = useForm();
  const { isSubmitting, errors } = formState;

  // Cargar lista de empresas para el selector
  useEffect(() => {
    if (!database) return;

    const db = database;
    const loadEmpresas = async () => {
      try {
        const empresasCollection = collection(db, 'empresas');
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

  async function onSubmit(payload: WorkerPayload) {
    try {
      setHasErrored(false);
      setErrorMessage('');
      
      console.log('=== INICIANDO GUARDADO DE TRABAJADOR ===');
      console.log('Datos del formulario:', payload);
      
      // Verificar que database esté inicializado
      if (!database) {
        console.error('ERROR: Firebase database no está inicializado');
        throw new Error('Firebase no está inicializado. Por favor, instala Firebase: npm install firebase');
      }
      
      console.log('Firebase database está inicializado:', !!database);
      
      const newWorker = {
        name: payload.name,
        alias: payload.alias,
        address: payload.address,
        phoneNumber: payload.phoneNumber,
        job: payload.job,
        company: payload.company,
        workStatus: payload.workStatus,
        hireDate: new Date().getTime(), // Timestamp en milisegundos
      };
      
      console.log('Datos a guardar:', newWorker);
      
      // Guardar en Firestore (colección: workers)
      const workersCollection = collection(database, 'workers');
      console.log('Colección creada: workers');
      
      console.log('Intentando guardar en Firestore...');
      const docRef = await addDoc(workersCollection, newWorker);
      
      console.log('=== TRABAJADOR GUARDADO EXITOSAMENTE ===');
      console.log('ID del documento:', docRef.id);
      console.log('Ruta completa:', `workers/${docRef.id}`);
      console.log('Datos guardados:', newWorker);
      
      // Verificar que se guardó correctamente leyendo de nuevo
      const db = database;
      if (db) {
        setTimeout(async () => {
          try {
            const verifyDoc = doc(db, 'workers', docRef.id);
          const docSnap = await getDoc(verifyDoc);
          if (docSnap.exists()) {
            console.log('✅ Verificación: El trabajador existe en Firestore');
            console.log('Datos verificados:', docSnap.data());
          } else {
            console.warn('⚠️ Advertencia: El trabajador no se encontró después de guardar');
          }
          } catch (verifyError) {
            console.error('Error al verificar:', verifyError);
          }
        }, 1000);
      }
      
      setHasSuccessfullyAdded(true);
      reset();
      
      // Resetear el mensaje de éxito después de 2 segundos
      setTimeout(() => {
        setHasSuccessfullyAdded(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (error: any) {
      console.error('=== ERROR AL AÑADIR TRABAJADOR ===');
      console.error('Error completo:', error);
      console.error('Tipo de error:', typeof error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje de error:', error?.message);
      console.error('Stack trace:', error?.stack);
      
      if (error?.code === 'permission-denied') {
        console.error('⚠️ ERROR DE PERMISOS: Necesitas configurar las reglas de Firestore');
        console.error('Ve a Firebase Console → Firestore Database → Rules');
        console.error('Y configura: allow read, write: if true;');
      }
      
      const errorMsg = error?.message || error?.code || 'Error desconocido al conectar con Firebase';
      setErrorMessage(errorMsg);
      setHasErrored(true);
      
      // Ocultar el error después de 5 segundos
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
        <SectionTitle>Añadir Nuevo Trabajador</SectionTitle>
        {onSuccess && (
          <CloseButton onClick={onSuccess} type="button">
            ×
          </CloseButton>
        )}
      </FormHeader>
      {hasSuccessfullyAdded && <SuccessMessage>✓ Trabajador añadido correctamente</SuccessMessage>}
      {hasErrored && (
        <ErrorMessage>
          <strong>Error de Permisos en Firebase</strong>
          <br />
          {errorMessage?.includes('PERMISSION_DENIED') ? (
            <>
              <p>Necesitas configurar las reglas de seguridad de Firebase:</p>
              <ol style={{ marginLeft: '2rem', marginTop: '1rem' }}>
                <li>Ve a <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(var(--primary))' }}>Firebase Console</a></li>
                <li>Selecciona tu proyecto: <strong>constructdb-2616b</strong></li>
                <li>Ve a <strong>Realtime Database</strong> → <strong>Rules</strong></li>
                <li>Copia y pega estas reglas:</li>
              </ol>
              <CodeBlock>
                {`{
  "rules": {
    "worker": {
      ".read": true,
      ".write": true
    }
  }
}`}
              </CodeBlock>
              <p style={{ marginTop: '1rem' }}>5. Haz clic en <strong>Publish</strong> para guardar</p>
            </>
          ) : (
            <>
              Error: {errorMessage || 'Error desconocido'}
              <br />
              <small>Revisa la consola del navegador para más detalles.</small>
            </>
          )}
        </ErrorMessage>
      )}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputGroup>
          <InputStack>
            {errors.name && <ErrorMessage>El nombre es requerido</ErrorMessage>}
            <StyledInput 
              placeholder="Nombre *" 
              id="name" 
              disabled={isDisabled} 
              {...register('name', { required: true })} 
            />
          </InputStack>
          <InputStack>
            {errors.alias && <ErrorMessage>El alias es requerido</ErrorMessage>}
            <StyledInput 
              placeholder="Alias *" 
              id="alias" 
              disabled={isDisabled} 
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
              disabled={isDisabled} 
              {...register('address', { required: true })} 
            />
          </InputStack>
          <InputStack>
            {errors.phoneNumber && <ErrorMessage>El teléfono es requerido</ErrorMessage>}
            <StyledInput 
              type="tel"
              placeholder="Teléfono *" 
              id="phoneNumber" 
              disabled={isDisabled} 
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
              disabled={isDisabled} 
              {...register('job', { required: true })} 
            />
          </InputStack>
          <InputStack>
            {errors.company && <ErrorMessage>La empresa es requerida</ErrorMessage>}
            {empresasList.length > 0 ? (
              <SelectInput
                id="company"
                disabled={isDisabled}
                {...register('company', { required: true })}
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
                id="company" 
                disabled={isDisabled} 
                {...register('company', { required: true })} 
              />
            )}
          </InputStack>
        </InputGroup>
        <InputGroup>
          <InputStack>
            {errors.workStatus && <ErrorMessage>El estado laboral es requerido</ErrorMessage>}
            <SelectInput
              id="workStatus"
              disabled={isDisabled}
              {...register('workStatus', { required: true })}
            >
              <option value="">Selecciona un estado</option>
              <option value="contratado">Contratado</option>
              <option value="despedido">Despedido</option>
            </SelectInput>
          </InputStack>
        </InputGroup>
        <Button as="button" type="submit" disabled={isSubmitDisabled}>
          Añadir Trabajador
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

const ErrorMessage = styled.p`
  color: rgb(var(--errorColor));
  font-size: 1.4rem;
  margin: 0;
  padding: 0.5rem 0;
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

const CodeBlock = styled.pre`
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  overflow-x: auto;
  font-size: 1.4rem;
  margin: 1rem 0;
  border: 1px solid rgba(var(--text), 0.1);
  color: rgb(var(--text));
`;

