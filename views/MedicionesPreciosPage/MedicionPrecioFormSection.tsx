import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import { database } from 'lib/firebase';

interface ConceptoItem {
  actividad: string;
  concepto: string;
  largo: string;
  alto: string;
  cantidad: string;
  total: string;
  observaciones?: string;
}

interface MedicionPayload {
  empresaNombre: string;
  empresaEmail: string;
  empresaTelefono1: string;
  empresaTelefono2: string;
  constructora: string;
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
  const [constructorasList, setConstructorasList] = useState<any[]>([]);
  const [actividadesList, setActividadesList] = useState<any[]>([]);
  // Función auxiliar para crear un concepto vacío
  const crearConceptoVacio = (): ConceptoItem => ({
    actividad: '',
    concepto: '',
    largo: '',
    alto: '',
    cantidad: '1',
    total: '0',
    observaciones: '',
  });

  // Inicializar con 10 filas por defecto
  const [conceptos, setConceptos] = useState<ConceptoItem[]>(() => 
    Array(10).fill(null).map(() => crearConceptoVacio())
  );
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

  // Cargar lista de constructoras para el selector
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

  // Cargar lista de actividades para el selector
  useEffect(() => {
    const loadActividades = async () => {
      if (!database) return;
      try {
        const actividadesCollection = collection(database, 'actividades');
        const actividadesQuery = query(actividadesCollection, orderBy('descripcion', 'asc'));
        const snapshot = await getDocs(actividadesQuery);
        const actividades = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActividadesList(actividades);
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      }
    };

    loadActividades();
  }, []);

  const agregarConcepto = () => {
    const nuevoConcepto = crearConceptoVacio();
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
      
      // Filtrar conceptos vacíos (solo los que tienen al menos concepto, largo o alto)
      const conceptosConDatos = conceptos.filter(c => 
        (c.concepto && c.concepto.trim() !== '') || 
        (c.largo && c.largo.trim() !== '') || 
        (c.alto && c.alto.trim() !== '')
      );
      
      // Validar que haya al menos un concepto con datos
      if (conceptosConDatos.length === 0) {
        setErrorMessage('Debes agregar al menos un concepto con datos');
        setHasErrored(true);
        return;
      }

      // Validar que todos los conceptos con datos tengan los campos requeridos
      const conceptosInvalidos = conceptosConDatos.some(c => !c.concepto || !c.largo || !c.alto);
      if (conceptosInvalidos) {
        setErrorMessage('Todos los conceptos deben tener concepto, L y H');
        setHasErrored(true);
        return;
      }
      
      console.log('=== INICIANDO GUARDADO DE MEDICIÓN ===');
      console.log('Datos del formulario:', payload);
      console.log('Conceptos con datos:', conceptosConDatos);
      
      // Verificar que database esté inicializado
      if (!database) {
        console.error('ERROR: Firebase database no está inicializado');
        throw new Error('Firebase no está inicializado. Por favor, instala Firebase: npm install firebase');
      }
      
      console.log('Firebase database está inicializado:', !!database);

      const newMedicion = {
        empresaNombre: payload.empresaNombre,
        empresaEmail: payload.empresaEmail,
        empresaTelefono1: payload.empresaTelefono1,
        empresaTelefono2: payload.empresaTelefono2,
        constructora: payload.constructora,
        obra: payload.obra,
        fecha: payload.fecha,
        conceptos: conceptosConDatos,
        // Mantener compatibilidad con estructura anterior
        empresa: payload.empresaNombre,
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
      // Reinicializar con 10 filas por defecto
      setConceptos(Array(10).fill(null).map(() => crearConceptoVacio()));
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
          <HeaderLeft>
            <ProjectInfo>
              <ProjectRow>
                <ProjectLabel>Constructora:</ProjectLabel>
                <ProjectValue>
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
                </ProjectValue>
              </ProjectRow>
              <ProjectRow>
                <ProjectLabel>Obra:</ProjectLabel>
                <ProjectValue>
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
                </ProjectValue>
              </ProjectRow>
              <ProjectRow>
                <ProjectLabel>Fecha:</ProjectLabel>
                <ProjectValue>
                  {errors.fecha && <ErrorMessage>La fecha es requerida</ErrorMessage>}
                  <StyledInput
                    type="date"
                    placeholder="Fecha *"
                    id="fecha"
                    disabled={isDisabled}
                    {...register('fecha', { required: true })}
                  />
                </ProjectValue>
              </ProjectRow>
            </ProjectInfo>
          </HeaderLeft>
          <HeaderRight>
            <CompanyInfo>
              <CompanyName>
                {errors.empresaNombre && <ErrorMessage>El nombre es requerido</ErrorMessage>}
                {empresasList.length > 0 ? (
                  <SelectInput
                    id="empresaNombre"
                    disabled={isDisabled}
                    {...register('empresaNombre', { required: 'El nombre es requerido' })}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setValue('empresaNombre', valor, { shouldValidate: true });
                      const empresaSeleccionada = empresasList.find(emp => emp.nombre === valor);
                      if (empresaSeleccionada) {
                        setValue('empresaEmail', empresaSeleccionada.email || '');
                        setValue('empresaTelefono1', empresaSeleccionada.telefono || empresaSeleccionada.telefono1 || '');
                        setValue('empresaTelefono2', empresaSeleccionada.telefono2 || '');
                      } else {
                        setValue('empresaEmail', '');
                        setValue('empresaTelefono1', '');
                        setValue('empresaTelefono2', '');
                      }
                    }}
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
                    placeholder="Nombre empresa *"
                    id="empresaNombre"
                    disabled={isDisabled}
                    {...register('empresaNombre', { required: 'El nombre es requerido' })}
                  />
                )}
              </CompanyName>
              <CompanyDetail>
                <Label>Email:</Label>
                <StyledInput
                  type="email"
                  placeholder="Email *"
                  id="empresaEmail"
                  readOnly
                  {...register('empresaEmail', { required: true })}
                />
              </CompanyDetail>
              <CompanyDetail>
                <Label>Teléfonos:</Label>
                <PhoneInputsWrapper>
                  <StyledInput
                    type="tel"
                    placeholder="Teléfono 1 *"
                    id="empresaTelefono1"
                    readOnly
                    {...register('empresaTelefono1', { required: true })}
                  />
                  <StyledInput
                    type="tel"
                    placeholder="Teléfono 2"
                    id="empresaTelefono2"
                    readOnly
                    {...register('empresaTelefono2')}
                  />
                </PhoneInputsWrapper>
              </CompanyDetail>
            </CompanyInfo>
          </HeaderRight>
        </HeaderSection>

        <ConceptosSection>
          <ConceptosHeader>
            <h3>HOJA DE MEDICIONES</h3>
            <AddButton type="button" onClick={agregarConcepto} disabled={isDisabled}>
              + Agregar Fila
            </AddButton>
          </ConceptosHeader>

          {conceptos.length > 0 && (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCellActividad>Actividad</TableHeaderCellActividad>
                    <TableHeaderCell style={{ width: '35%' }}>Concepto</TableHeaderCell>
                    <TableHeaderCell style={{ width: '2%', textAlign: 'center', paddingLeft: '1.5rem' }}>L</TableHeaderCell>
                    <TableHeaderCell style={{ width: '2%', textAlign: 'center', paddingLeft: '1.5rem' }}>H</TableHeaderCell>
                    <TableHeaderCell style={{ width: '2%', textAlign: 'center', paddingLeft: '1.5rem' }}>N</TableHeaderCell>
                    <TableHeaderCell style={{ width: '1.125%', textAlign: 'right' }}>Total</TableHeaderCell>
                    <TableHeaderCell style={{ width: '1%', padding: '0.5rem' }}></TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conceptos.map((concepto, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ whiteSpace: 'nowrap' }}>
                        {actividadesList.length > 0 ? (
                          <TableSelect
                            disabled={isDisabled}
                            value={concepto.actividad}
                            onChange={(e) => actualizarConcepto(index, 'actividad', e.target.value)}
                          >
                            <option value="">Actividades</option>
                            {actividadesList.map((actividad) => (
                              <option key={actividad.id} value={actividad.descripcion}>
                                {actividad.descripcion}
                              </option>
                            ))}
                          </TableSelect>
                        ) : (
                          <TableInput
                            type="text"
                            placeholder="Actividad"
                            disabled={isDisabled}
                            value={concepto.actividad}
                            onChange={(e) => actualizarConcepto(index, 'actividad', e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <TableTextarea
                          placeholder="Concepto *"
                          disabled={isDisabled}
                          value={concepto.concepto}
                          onChange={(e) => {
                            actualizarConcepto(index, 'concepto', e.target.value);
                            // Auto-resize textarea
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                          onInput={(e) => {
                            // Auto-resize on input
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                          rows={1}
                          required
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>
                        <TableInputNumber
                          type="number"
                          step="0.01"
                          placeholder="L"
                          disabled={isDisabled}
                          value={concepto.largo}
                          onChange={(e) => actualizarConcepto(index, 'largo', e.target.value)}
                          required
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>
                        <TableInputNumber
                          type="number"
                          step="0.01"
                          placeholder="H"
                          disabled={isDisabled}
                          value={concepto.alto}
                          onChange={(e) => actualizarConcepto(index, 'alto', e.target.value)}
                          required
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>
                        <TotalCell style={{ textAlign: 'center' }}>
                          <TableInputNumber
                            type="number"
                            step="0.01"
                            placeholder="N"
                            disabled={isDisabled}
                            value={concepto.cantidad}
                            onChange={(e) => actualizarConcepto(index, 'cantidad', e.target.value)}
                          />
                        </TotalCell>
                      </TableCell>
                      <TableCell>
                        <TotalCell>{concepto.total || '0.00'}</TotalCell>
                      </TableCell>
                      <TableCell>
                        <DeleteRowButton type="button" onClick={() => eliminarConcepto(index)} disabled={isDisabled}>
                          ×
                        </DeleteRowButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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
  padding: 2rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;

  ${media('<=tablet')} {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  ${media('<=phone')} {
    padding: 1rem;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  min-width: 30rem;

  ${media('<=tablet')} {
    min-width: auto;
    width: 100%;
  }

  ${media('<=phone')} {
    justify-content: flex-start;
    width: 100%;
  }
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;

  ${media('<=phone')} {
    gap: 0.8rem;
  }
`;

const ProjectRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;

  ${media('<=phone')} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    width: 100%;
  }
`;

const ProjectLabel = styled.label`
  font-weight: bold;
  font-size: 1.4rem;
  color: rgb(var(--text));
  min-width: 12rem;
  flex-shrink: 0;

  ${media('<=phone')} {
    min-width: auto;
    font-size: 1.3rem;
    width: 100%;
    margin-bottom: 0.3rem;
  }
`;

const ProjectValue = styled.div`
  flex: 1;
  min-width: 20rem;
  width: 100%;

  ${media('<=phone')} {
    min-width: 100%;
    width: 100%;
    flex: none;

    input, select {
      width: 100% !important;
    }
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
  text-align: right;
  width: 100%;

  ${media('<=tablet')} {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }

  ${media('<=phone')} {
    gap: 0.8rem;
    width: 100%;
  }
`;

const CompanyName = styled.div`
  font-weight: bold;
  font-size: 1.6rem;
  color: rgb(var(--text));
  margin-bottom: 0.5rem;
  width: 100%;

  ${media('<=phone')} {
    font-size: 1.4rem;
    margin-bottom: 0.3rem;
    width: 100%;

    select, input {
      width: 100% !important;
    }
  }
`;

const CompanyDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;

  ${media('<=phone')} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
    width: 100%;
  }

  input {
    flex: 1;
    min-width: 12rem;

    ${media('<=phone')} {
      min-width: 100% !important;
      width: 100% !important;
      flex: none !important;
      display: block;
      box-sizing: border-box;
    }
  }

  label {
    min-width: 8rem;
    font-size: 1.4rem;
    margin-bottom: 0;
    flex-shrink: 0;

    ${media('<=phone')} {
      min-width: auto;
      width: 100%;
      font-size: 1.3rem;
      margin-bottom: 0.3rem;
      order: -1;
      display: block;
    }
  }
`;

const PhoneInputsWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  flex: 1;
  width: 100%;

  ${media('<=phone')} {
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;

    input {
      width: 100% !important;
      min-width: 100% !important;
      flex: none !important;
      box-sizing: border-box;
    }
  }
`;

const ConceptosSection = styled.div`
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  ${media('<=phone')} {
    padding: 1rem;
  }
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

  &[readonly] {
    background: rgba(var(--text), 0.05);
    cursor: default;
    opacity: 0.8;
    
    &:focus {
      border-color: rgba(var(--text), 0.25);
      box-shadow: none;
    }
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

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 1rem;
  -webkit-overflow-scrolling: touch;

  ${media('<=phone')} {
    margin-left: -1rem;
    margin-right: -1rem;
    padding: 0 1rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 2px solid rgba(var(--text), 0.2);
  min-width: 600px;
  table-layout: auto;

  ${media('<=phone')} {
    min-width: 500px;
    font-size: 1.2rem;
  }
`;

const TableHeader = styled.thead`
  background: rgba(var(--primary), 0.1);
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: rgba(var(--text), 0.02);
  }
  &:hover {
    background: rgba(var(--primary), 0.05);
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: bold;
  font-size: 1.4rem;
  color: rgb(var(--text));
  border: 1px solid rgba(var(--text), 0.2);
  background: rgba(var(--primary), 0.1);

  ${media('<=phone')} {
    padding: 0.8rem 0.5rem;
    font-size: 1.2rem;
  }
`;

const TableHeaderCellActividad = styled(TableHeaderCell)`
  width: 5.48%;
  white-space: nowrap;
`;

const TableCell = styled.td`
  padding: 0.5rem;
  border: 1px solid rgba(var(--text), 0.2);
  vertical-align: middle;
  white-space: nowrap;

  ${media('<=phone')} {
    padding: 0.4rem 0.3rem;
  }
`;

const TableInput = styled.input`
  width: 100%;
  min-width: 3rem;
  padding: 0.8rem;
  border: 1px solid rgba(var(--text), 0.2);
  border-radius: 0.3rem;
  font-size: 1.3rem;
  background: transparent;
  transition: border-color 0.2s;
  box-sizing: border-box;

  ${media('<=phone')} {
    padding: 0.6rem;
    font-size: 1.2rem;
    min-width: 2.5rem;
  }

  &:focus {
    outline: none;
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TableTextarea = styled.textarea`
  width: 100%;
  min-width: 3rem;
  min-height: 3.5rem;
  padding: 0.8rem;
  border: 1px solid rgba(var(--text), 0.2);
  border-radius: 0.3rem;
  font-size: 1.3rem;
  background: transparent;
  transition: border-color 0.2s;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
  overflow: hidden;

  ${media('<=phone')} {
    padding: 0.6rem;
    font-size: 1.2rem;
    min-width: 2.5rem;
    min-height: 3rem;
  }

  &:focus {
    outline: none;
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TableSelect = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid rgba(var(--text), 0.2);
  border-radius: 0.3rem;
  font-size: 1.3rem;
  background: transparent;
  transition: border-color 0.2s;
  box-sizing: border-box;

  ${media('<=phone')} {
    padding: 0.6rem;
    font-size: 1.2rem;
  }

  &:focus {
    outline: none;
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TableInputNumber = styled.input`
  width: 100%;
  min-width: 4rem;
  padding: 0.5rem 0.3rem;
  border: 1px solid rgba(var(--text), 0.2);
  border-radius: 0.3rem;
  font-size: 1.2rem;
  font-weight: 500;
  color: rgb(var(--text));
  background: white;
  transition: border-color 0.2s;
  box-sizing: border-box;
  text-align: center;

  ${media('<=phone')} {
    font-size: 1.1rem;
    padding: 0.4rem 0.25rem;
    min-width: 3rem;
  }

  &:focus {
    outline: none;
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(var(--text), 0.05);
  }

  &::placeholder {
    color: rgba(var(--text), 0.4);
    font-weight: normal;
    font-size: 1.1rem;
  }
`;

const TotalCell = styled.div`
  font-weight: bold;
  font-size: 1.4rem;
  color: rgb(var(--primary));
  text-align: right;
  padding: 0.8rem;
`;

const DeleteRowButton = styled.button`
  background: rgb(var(--errorColor));
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  margin: 0 auto;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
