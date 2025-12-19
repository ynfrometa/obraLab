import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import SectionTitle from 'components/SectionTitle';
import { database } from 'lib/firebase';

interface ConceptoItem {
  concepto: string;
  largo: string;
  alto: string;
  cantidad: string;
  total: string;
  observaciones: string;
}

interface MedicionPayload {
  concepto: string;
  empresa: string;
  obra: string;
  fecha: string;
  conceptos: ConceptoItem[];
}

export default function MedicionFormSection() {
  const [hasSuccessfullyAdded, setHasSuccessfullyAdded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [obrasList, setObrasList] = useState<any[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoItem[]>([]);
  const { register, handleSubmit, formState, reset, watch, setValue } = useForm<MedicionPayload>();
  const { isSubmitting, errors } = formState;

  // Cargar lista de obras para el selector
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

  const agregarConcepto = () => {
    const nuevoConcepto: ConceptoItem = {
      concepto: '',
      largo: '',
      alto: '',
      cantidad: '1',
      total: '0',
      observaciones: '',
    };
    setConceptos([...conceptos, nuevoConcepto]);
  };

  const eliminarConcepto = (index: number) => {
    const nuevosConceptos = conceptos.filter((_, i) => i !== index);
    setConceptos(nuevosConceptos);
  };

  const actualizarConcepto = (index: number, campo: keyof ConceptoItem, valor: string) => {
    const nuevosConceptos = [...conceptos];
    const concepto = { ...nuevosConceptos[index] };
    
    concepto[campo] = valor;
    
    // Calcular total automáticamente si cambian largo, alto o cantidad
    if (campo === 'largo' || campo === 'alto' || campo === 'cantidad') {
      const largo = parseFloat(concepto.largo) || 0;
      const alto = parseFloat(concepto.alto) || 0;
      const cantidad = parseFloat(concepto.cantidad) || 1;
      concepto.total = (largo * alto * cantidad).toFixed(2);
    }
    
    nuevosConceptos[index] = concepto;
    setConceptos(nuevosConceptos);
  };

  async function onSubmit(payload: MedicionPayload) {
    try {
      setHasErrored(false);
      setErrorMessage('');
      
      // Validar que haya al menos un concepto
      if (conceptos.length === 0) {
        setErrorMessage('Debes agregar al menos un concepto');
        setHasErrored(true);
        return;
      }

      // Validar que todos los conceptos tengan los campos requeridos
      const conceptosInvalidos = conceptos.some(c => !c.concepto || !c.largo || !c.alto);
      if (conceptosInvalidos) {
        setErrorMessage('Todos los conceptos deben tener concepto, largo y alto');
        setHasErrored(true);
        return;
      }
      
      console.log('=== INICIANDO GUARDADO DE MEDICIÓN ===');
      console.log('Datos del formulario:', payload);
      console.log('Conceptos:', conceptos);
      
      // Verificar que database esté inicializado
      if (!database) {
        console.error('ERROR: Firebase database no está inicializado');
        throw new Error('Firebase no está inicializado. Por favor, instala Firebase: npm install firebase');
      }
      
      console.log('Firebase database está inicializado:', !!database);

      const newMedicion = {
        concepto: payload.concepto,
        empresa: payload.empresa,
        obra: payload.obra,
        fecha: payload.fecha,
        conceptos: conceptos,
        fechaCreacion: new Date().getTime(),
      };
      
      console.log('Datos a guardar:', newMedicion);
      
      // Guardar en Firestore (colección: mediciones)
      const medicionesCollection = collection(database, 'mediciones');
      console.log('Colección creada: mediciones');
      
      console.log('Intentando guardar en Firestore...');
      const docRef = await addDoc(medicionesCollection, newMedicion);
      
      console.log('=== MEDICIÓN GUARDADA EXITOSAMENTE ===');
      console.log('ID del documento:', docRef.id);
      console.log('Ruta completa:', `mediciones/${docRef.id}`);
      console.log('Datos guardados:', newMedicion);
      
      setHasSuccessfullyAdded(true);
      setConceptos([]);
      reset();
      
      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setHasSuccessfullyAdded(false);
      }, 3000);
    } catch (error: any) {
      console.error('=== ERROR AL AÑADIR MEDICIÓN ===');
      console.error('Error completo:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje de error:', error?.message);
      
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        setErrorMessage(
          `⚠️ ERROR DE PERMISOS: Necesitas configurar las reglas de Firestore.
          Ve a Firebase Console → Firestore Database → Rules y configura:
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /mediciones/{document=**} {
                allow read, write: if true;
              }
            }
          }`
        );
      } else {
        const errorMsg = error?.message || error?.code || 'Error desconocido al conectar con Firebase';
        setErrorMessage(errorMsg);
      }
      setHasErrored(true);
      
      // Ocultar el error después de 5 segundos
      setTimeout(() => {
        setHasErrored(false);
        setErrorMessage('');
      }, 5000);
    }
  }

  const isDisabled = isSubmitting;
  const isSubmitDisabled = Object.keys(errors).length > 0 || isDisabled || conceptos.length === 0;

  return (
    <Wrapper>
      <SectionTitle>Añadir Nueva Hoja de Mediciones</SectionTitle>
      {hasSuccessfullyAdded && <SuccessMessage>✓ Hoja de mediciones añadida correctamente</SuccessMessage>}
      {hasErrored && (
        <ErrorMessage>
          Error al añadir hoja de mediciones: {errorMessage || 'Por favor, intenta de nuevo.'}
          <br />
          <small>Revisa la consola del navegador para más detalles.</small>
        </ErrorMessage>
      )}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <HeaderSection>
          <InputStack>
            {errors.concepto && <ErrorMessage>El concepto es requerido</ErrorMessage>}
            <StyledInput
              placeholder="Concepto (descripción) *"
              id="concepto"
              disabled={isDisabled}
              {...register('concepto', { required: true })}
            />
          </InputStack>
          <InputGroup>
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
                <Input 
                  placeholder="Empresa" 
                  id="empresa" 
                  disabled={isDisabled} 
                  {...register('empresa', { required: true })} 
                />
              )}
            </InputStack>
            <InputStack>
              {errors.obra && <ErrorMessage>La obra es requerida</ErrorMessage>}
              {obrasList.length > 0 ? (
                <SelectInput
                  id="obra"
                  disabled={isDisabled}
                  {...register('obra', { required: true })}
                >
                  <option value="">Selecciona una obra</option>
                  {obrasList.map((obra) => (
                    <option key={obra.id} value={obra.empresa}>
                      {obra.empresa}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <Input 
                  placeholder="Obra" 
                  id="obra" 
                  disabled={isDisabled} 
                  {...register('obra', { required: true })} 
                />
              )}
            </InputStack>
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
          </InputGroup>
        </HeaderSection>

        <ConceptosSection>
          <ConceptosHeader>
            <h3>Mediciones</h3>
            <AddButton type="button" onClick={agregarConcepto} disabled={isDisabled}>
              + Agregar Medicion
            </AddButton>
          </ConceptosHeader>

          {conceptos.length === 0 && (
            <EmptyState>
              No hay conceptos agregados. Haz clic en "Agregar Medicion" para comenzar.
            </EmptyState>
          )}

          {conceptos.map((concepto, index) => (
            <ConceptoCard key={index}>
              <ConceptoHeader>
                <ConceptoTitle>Concepto #{index + 1}</ConceptoTitle>
                <DeleteButton type="button" onClick={() => eliminarConcepto(index)} disabled={isDisabled}>
                  × Eliminar
                </DeleteButton>
              </ConceptoHeader>
              
              <InputStack>
                <StyledInput 
                  placeholder="Concepto *" 
                  disabled={isDisabled}
                  value={concepto.concepto}
                  onChange={(e) => actualizarConcepto(index, 'concepto', e.target.value)}
                  required
                />
              </InputStack>

              <InputGroup>
                <InputStack>
                  <StyledInput 
                    type="number"
                    step="0.01"
                    placeholder="Largo *" 
                    disabled={isDisabled}
                    value={concepto.largo}
                    onChange={(e) => actualizarConcepto(index, 'largo', e.target.value)}
                    required
                  />
                </InputStack>
                <InputStack>
                  <StyledInput 
                    type="number"
                    step="0.01"
                    placeholder="Alto *" 
                    disabled={isDisabled}
                    value={concepto.alto}
                    onChange={(e) => actualizarConcepto(index, 'alto', e.target.value)}
                    required
                  />
                </InputStack>
                <InputStack>
                  <StyledInput 
                    type="number"
                    step="0.01"
                    placeholder="Cantidad (por defecto: 1)" 
                    disabled={isDisabled}
                    value={concepto.cantidad}
                    onChange={(e) => actualizarConcepto(index, 'cantidad', e.target.value)}
                  />
                </InputStack>
              </InputGroup>

              <InputStack>
                <TotalDisplay>
                  <TotalLabel>Total calculado:</TotalLabel>
                  <TotalValue>{concepto.total}</TotalValue>
                </TotalDisplay>
              </InputStack>

              <InputStack>
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  as="textarea"
                  placeholder="Observaciones adicionales"
                  disabled={isDisabled}
                  value={concepto.observaciones}
                  onChange={(e) => actualizarConcepto(index, 'observaciones', e.target.value)}
                />
              </InputStack>
            </ConceptoCard>
          ))}
        </ConceptosSection>

        <Button as="button" type="submit" disabled={isSubmitDisabled}>
          Añadir Hoja de Mediciones
        </Button>
      </Form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const Form = styled.form`
  & > * {
    margin-bottom: 2rem;
  }
`;

const HeaderSection = styled.div`
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const ConceptosSection = styled.div`
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ConceptosHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(var(--primary), 0.3);

  h3 {
    font-size: 1.6rem;
    font-weight: bold;
    color: rgb(var(--primary));
    margin: 0;
  }

  ${media('<=tablet')} {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ConceptoCard = styled.div`
  background: rgba(var(--primary), 0.05);
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--primary), 0.3);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:last-child {
    margin-bottom: 0;
  }
`;

const ConceptoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;

  ${media('<=tablet')} {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ConceptoTitle = styled.h4`
  font-size: 1.5rem;
  font-weight: bold;
  color: rgb(var(--primary));
  margin: 0;
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

const Label = styled.label`
  font-weight: 600;
  font-size: 1.3rem;
  color: rgb(var(--text));
  opacity: 0.9;
  margin-bottom: 0.4rem;
  display: block;
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

const TotalDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(var(--primary), 0.1);
  border-radius: 0.5rem;
  border: 2px solid rgb(var(--primary));
  margin-top: 0.5rem;
`;

const TotalLabel = styled.span`
  font-weight: bold;
  font-size: 1.4rem;
  color: rgb(var(--text));
`;

const TotalValue = styled.span`
  font-weight: bold;
  font-size: 1.8rem;
  color: rgb(var(--primary));
`;

const AddButton = styled.button`
  background: rgb(var(--primary));
  color: white;
  border: none;
  border-radius: 0.6rem;
  padding: 1rem 2rem;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  background: rgb(var(--errorColor));
  color: white;
  border: none;
  border-radius: 0.6rem;
  padding: 1rem 2rem;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.p`
  text-align: center;
  padding: 2rem;
  color: rgba(var(--text), 0.6);
  font-size: 1.4rem;
  background: rgba(var(--text), 0.05);
  border-radius: 0.5rem;
  border: 2px dashed rgba(var(--text), 0.25);
`;
