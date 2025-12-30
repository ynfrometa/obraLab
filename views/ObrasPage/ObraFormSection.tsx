import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { collection, addDoc, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import SectionTitle from 'components/SectionTitle';
import { database } from 'lib/firebase';

interface ObraPayload {
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

export default function ObraFormSection() {
  const [hasSuccessfullyAdded, setHasSuccessfullyAdded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState<string[]>([]);
  const { register, handleSubmit, formState, reset } = useForm<ObraPayload>();
  const { isSubmitting, errors } = formState;

  // Cargar lista de empresas para el selector
  useEffect(() => {
    if (!database) return;

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

  async function onSubmit(payload: ObraPayload) {
    try {
      setHasErrored(false);
      setErrorMessage('');

      // Validar que haya al menos una empresa seleccionada
      if (empresasSeleccionadas.length === 0) {
        setErrorMessage('Debes seleccionar al menos una empresa');
        setHasErrored(true);
        return;
      }
      
      console.log('=== INICIANDO GUARDADO DE OBRA ===');
      console.log('Datos del formulario:', payload);
      console.log('Empresas seleccionadas:', empresasSeleccionadas);
      
      // Verificar que database esté inicializado
      if (!database) {
        console.error('ERROR: Firebase database no está inicializado');
        throw new Error('Firebase no está inicializado. Por favor, instala Firebase: npm install firebase');
      }
      
      console.log('Firebase database está inicializado:', !!database);
      
      const newObra = {
        empresa: empresasSeleccionadas,
        descripcion: payload.descripcion,
        constructora: payload.constructora,
        encargado: payload.encargado,
        encargadoTel: payload.encargadoTel,
        jefeObra: payload.jefeObra,
        jefeObraTel: payload.jefeObraTel,
        direccion: payload.direccion,
        poblado: payload.poblado,
        estado: payload.estado,
        fechaInicio: payload.fechaInicio,
        solicitud: payload.solicitud,
        fechaCreacion: new Date().getTime(),
      };
      
      console.log('Datos a guardar:', newObra);
      
      // Guardar en Firestore (colección: obras)
      const obrasCollection = collection(database, 'obras');
      console.log('Colección creada: obras');
      
      console.log('Intentando guardar en Firestore...');
      const docRef = await addDoc(obrasCollection, newObra);
      
      console.log('=== OBRA GUARDADA EXITOSAMENTE ===');
      console.log('ID del documento:', docRef.id);
      console.log('Ruta completa:', `obras/${docRef.id}`);
      console.log('Datos guardados:', newObra);
      
      // Verificar que se guardó correctamente
      const db = database;
      if (db) {
        setTimeout(async () => {
          try {
            const verifyDoc = doc(db, 'obras', docRef.id);
            const docSnap = await getDoc(verifyDoc);
            if (docSnap.exists()) {
              console.log('✅ Verificación: La obra existe en Firestore');
              console.log('Datos verificados:', docSnap.data());
            } else {
              console.warn('⚠️ Advertencia: La obra no se encontró después de guardar');
            }
          } catch (verifyError) {
            console.error('Error al verificar:', verifyError);
          }
        }, 1000);
      }
      
      setHasSuccessfullyAdded(true);
      setEmpresasSeleccionadas([]);
      reset();
      
      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setHasSuccessfullyAdded(false);
      }, 3000);
    } catch (error: any) {
      console.error('=== ERROR AL AÑADIR OBRA ===');
      console.error('Error completo:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje de error:', error?.message);
      
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
  const isSubmitDisabled = Object.keys(errors).length > 0 || isDisabled || empresasSeleccionadas.length === 0;

  return (
    <Wrapper>
      <SectionTitle>Añadir Nueva Obra</SectionTitle>
      {hasSuccessfullyAdded && <SuccessMessage>✓ Obra añadida correctamente</SuccessMessage>}
      {hasErrored && (
        <ErrorMessage>
          Error al añadir obra: {errorMessage || 'Por favor, intenta de nuevo.'}
          <br />
          <small>Revisa la consola del navegador para más detalles.</small>
        </ErrorMessage>
      )}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormSection>
          <SectionSubtitle>Información de la Obra</SectionSubtitle>
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
                      disabled={isDisabled}
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
            {empresasSeleccionadas.length > 0 && (
              <SelectedInfo>
                {empresasSeleccionadas.length} empresa(s) seleccionada(s): {empresasSeleccionadas.join(', ')}
              </SelectedInfo>
            )}
          </InputStack>
        </FormSection>
        <FormSection>
          <SectionSubtitle>Detalles de la Obra</SectionSubtitle>
          <InputStack>
            {errors.descripcion && <ErrorMessage>La descripción es requerida</ErrorMessage>}
            <Textarea
              as="textarea"
              placeholder="Descripción *"
              id="descripcion"
              disabled={isDisabled}
              {...register('descripcion', { required: true })}
            />
          </InputStack>
          <InputGroup>
            <InputStack>
              {errors.constructora && <ErrorMessage>La constructora es requerida</ErrorMessage>}
            <StyledInput 
              placeholder="Constructora *" 
              id="constructora" 
              disabled={isDisabled} 
              {...register('constructora', { required: true })} 
            />
            </InputStack>
            <InputStack>
              {errors.estado && <ErrorMessage>El estado es requerido</ErrorMessage>}
              <SelectInput
                id="estado"
                disabled={isDisabled}
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
        </FormSection>
        <FormSection>
          <SectionSubtitle>Contactos</SectionSubtitle>
          <InputGroup>
            <InputStack>
              {errors.encargado && <ErrorMessage>El encargado es requerido</ErrorMessage>}
              <StyledInput 
                placeholder="Encargado *" 
                id="encargado" 
                disabled={isDisabled} 
                {...register('encargado', { required: true })} 
              />
            </InputStack>
            <InputStack>
              {errors.encargadoTel && <ErrorMessage>El teléfono del encargado es requerido</ErrorMessage>}
              <StyledInput 
                type="tel"
                placeholder="Teléfono Encargado *" 
                id="encargadoTel" 
                disabled={isDisabled} 
                {...register('encargadoTel', { required: true })} 
              />
            </InputStack>
          </InputGroup>
          <InputGroup>
            <InputStack>
              {errors.jefeObra && <ErrorMessage>El jefe de obra es requerido</ErrorMessage>}
              <StyledInput 
                placeholder="Jefe de obra *" 
                id="jefeObra" 
                disabled={isDisabled} 
                {...register('jefeObra', { required: true })} 
              />
            </InputStack>
            <InputStack>
              {errors.jefeObraTel && <ErrorMessage>El teléfono del jefe de obra es requerido</ErrorMessage>}
              <StyledInput 
                type="tel"
                placeholder="Teléfono Jefe de obra *" 
                id="jefeObraTel" 
                disabled={isDisabled} 
                {...register('jefeObraTel', { required: true })} 
              />
            </InputStack>
          </InputGroup>
        </FormSection>

        <FormSection>
          <SectionSubtitle>Ubicación</SectionSubtitle>
          <InputGroup>
            <InputStack>
              {errors.direccion && <ErrorMessage>La dirección es requerida</ErrorMessage>}
              <StyledInput 
                placeholder="Dirección *" 
                id="direccion" 
                disabled={isDisabled} 
                {...register('direccion', { required: true })} 
              />
            </InputStack>
            <InputStack>
              {errors.poblado && <ErrorMessage>El poblado es requerido</ErrorMessage>}
              <StyledInput 
                placeholder="Poblado *" 
                id="poblado" 
                disabled={isDisabled} 
                {...register('poblado', { required: true })} 
              />
            </InputStack>
          </InputGroup>
          <InputGroup>
            <InputStack>
              {errors.fechaInicio && <ErrorMessage>La fecha de inicio es requerida</ErrorMessage>}
              <StyledInput 
                type="date"
                placeholder="Fecha Inicio *" 
                id="fechaInicio" 
                disabled={isDisabled} 
                {...register('fechaInicio', { required: true })} 
              />
            </InputStack>
            <InputStack>
              {errors.solicitud && <ErrorMessage>La solicitud es requerida</ErrorMessage>}
              <StyledInput 
                placeholder="Solicitud *" 
                id="solicitud" 
                disabled={isDisabled} 
                {...register('solicitud', { required: true })} 
              />
            </InputStack>
          </InputGroup>
        </FormSection>
        <Button as="button" type="submit" disabled={isSubmitDisabled}>
          Añadir Obra
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
  gap: 2rem;
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

  ${media('<=phone')} {
    gap: 1rem;
    margin-bottom: 1rem;
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

const SuccessMessage = styled.p`
  color: rgb(34, 197, 94);
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 0.6rem;
  margin-bottom: 2rem;
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

const Textarea = styled(StyledInput)`
  width: 100%;
  min-height: 8rem;
  resize: vertical;
  font-family: inherit;
`;

const SelectInput = styled.select`
  border: 2px solid rgba(var(--text), 0.2);
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

const Label = styled.label`
  font-weight: 600;
  font-size: 1.3rem;
  color: rgb(var(--text));
  opacity: 0.9;
  margin-bottom: 0.4rem;
  display: block;
`;

const CheckboxContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.6rem;
  padding: 1rem;
  background: rgba(var(--text), 0.03);
  border-radius: 0.5rem;
  border: 2px solid rgba(var(--text), 0.2);
  max-height: 12rem;
  overflow-y: auto;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
    max-height: 10rem;
  }

  ${media('<=phone')} {
    padding: 0.8rem;
    gap: 0.5rem;
    max-height: 8rem;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  padding: 0.6rem 0.8rem;
  border-radius: 0.4rem;
  transition: background 0.2s;
  font-size: 1.4rem;

  &:hover {
    background: rgba(var(--primary), 0.1);
  }
`;

const CheckboxInput = styled.input`
  width: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  accent-color: rgb(var(--primary));
  flex-shrink: 0;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CheckboxText = styled.span`
  font-size: 1.4rem;
  color: rgb(var(--text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

const FormSection = styled.div`
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  ${media('<=tablet')} {
    padding: 1.2rem;
    gap: 1rem;
  }

  ${media('<=phone')} {
    padding: 1rem;
    gap: 0.8rem;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionSubtitle = styled.h3`
  font-size: 1.6rem;
  font-weight: bold;
  color: rgb(var(--primary));
  margin: 0;
  padding-bottom: 0.8rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid rgba(var(--primary), 0.3);
`;

const SelectedInfo = styled.div`
  margin-top: 0.5rem;
  padding: 0.8rem 1rem;
  background: rgba(var(--primary), 0.1);
  border-radius: 0.4rem;
  font-size: 1.3rem;
  color: rgb(var(--primary));
  font-weight: 500;
`;
