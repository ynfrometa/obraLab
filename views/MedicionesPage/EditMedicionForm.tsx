import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from 'components/Button';
import Input from 'components/Input';
import { media } from 'utils/media';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
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

interface Medicion {
  id: string;
  empresaNombre?: string;
  empresaEmail?: string;
  empresaTelefono1?: string;
  empresaTelefono2?: string;
  constructora?: string;
  obra: string | string[]; // Puede ser string o array de strings
  fecha: string;
  conceptos?: ConceptoItem[];
  // Campos legacy para compatibilidad
  empresa?: string;
  concepto?: string;
  largo?: string;
  alto?: string;
  cantidad?: string;
  total?: string;
  observaciones?: string;
  fechaCreacion?: number;
}

interface EditMedicionFormProps {
  medicion: Medicion;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function EditMedicionForm({ medicion, onSave, onCancel }: EditMedicionFormProps) {
  const [obrasList, setObrasList] = useState<any[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [constructorasList, setConstructorasList] = useState<any[]>([]);
  const [actividadesList, setActividadesList] = useState<any[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoItem[]>(() => {
    // Si tiene conceptos (nueva estructura), usarlos
    if (medicion.conceptos && medicion.conceptos.length > 0) {
      return medicion.conceptos.map(c => ({
        ...c,
        actividad: c.actividad || '',
      }));
    }
    // Si no, convertir estructura legacy a nueva estructura
    if (medicion.concepto) {
      return [{
        actividad: '',
        concepto: medicion.concepto || '',
        largo: medicion.largo || '',
        alto: medicion.alto || '',
        cantidad: medicion.cantidad || '1',
        total: medicion.total || '0',
        observaciones: medicion.observaciones || '',
      }];
    }
    return [];
  });

  const { register, handleSubmit, formState, setValue } = useForm({
    defaultValues: {
      empresaNombre: medicion.empresaNombre || medicion.empresa || '',
      empresaEmail: medicion.empresaEmail || '',
      empresaTelefono1: medicion.empresaTelefono1 || '',
      empresaTelefono2: medicion.empresaTelefono2 || '',
      constructora: medicion.constructora || '',
      obra: Array.isArray(medicion.obra) ? medicion.obra[0] || '' : (medicion.obra || ''),
      fecha: medicion.fecha,
    },
  });
  const { errors, isSubmitting } = formState;

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
    const nuevoConcepto: ConceptoItem = {
      actividad: '',
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

  const onSubmit = (data: any) => {
    // Validar que haya al menos un concepto
    if (conceptos.length === 0) {
      alert('Debes agregar al menos un concepto');
      return;
    }

    // Validar que todos los conceptos tengan los campos requeridos
    const conceptosInvalidos = conceptos.some(c => !c.concepto || !c.largo || !c.alto);
    if (conceptosInvalidos) {
      alert('Todos los conceptos deben tener concepto, L y H');
      return;
    }

    onSave({
      ...data,
      conceptos: conceptos,
      // Mantener compatibilidad
      empresa: data.empresaNombre,
    });
  };

  return (
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
              </ProjectValue>
            </ProjectRow>
            <ProjectRow>
              <ProjectLabel>Obra:</ProjectLabel>
              <ProjectValue>
                {errors.obra && <ErrorMessage>La obra es requerida</ErrorMessage>}
                {obrasList.length > 0 ? (
                  <SelectInput
                    id="obra"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  {...register('empresaNombre', { required: true })}
                  onChange={(e) => {
                    const empresaSeleccionada = empresasList.find(emp => emp.nombre === e.target.value);
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
                  disabled={isSubmitting}
                  {...register('empresaNombre', { required: true })}
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
          <AddButton type="button" onClick={agregarConcepto} disabled={isSubmitting}>
            + Agregar Fila
          </AddButton>
        </ConceptosHeader>

        {conceptos.length === 0 && (
          <EmptyState>
            No hay mediciones agregadas. Haz clic en "Agregar Fila" para comenzar.
          </EmptyState>
        )}

        {conceptos.length > 0 && (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: '12%' }}>Actividad</TableHeaderCell>
                  <TableHeaderCell style={{ width: 'auto' }}>Concepto</TableHeaderCell>
                  <TableHeaderCell style={{ width: '7.5%', textAlign: 'center' }}>L</TableHeaderCell>
                  <TableHeaderCell style={{ width: '7.5%', textAlign: 'center' }}>H</TableHeaderCell>
                  <TableHeaderCell style={{ width: '7.5%', textAlign: 'center' }}>N</TableHeaderCell>
                  <TableHeaderCell style={{ width: '3.75%' }}>Total</TableHeaderCell>
                  <TableHeaderCell style={{ width: '4.5%' }}></TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conceptos.map((concepto, index) => (
                  <TableRow key={index}>
                      <TableCell>
                        {actividadesList.length > 0 ? (
                          <TableSelect
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                            value={concepto.actividad}
                            onChange={(e) => actualizarConcepto(index, 'actividad', e.target.value)}
                          />
                        )}
                      </TableCell>
                    <TableCell>
                      <TableTextarea
                        placeholder="Concepto *"
                        disabled={isSubmitting}
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
                      <TotalCell style={{ textAlign: 'center' }}>
                        <TableInputNumber
                          type="number"
                          step="0.01"
                          placeholder="L"
                          disabled={isSubmitting}
                          value={concepto.largo}
                          onChange={(e) => actualizarConcepto(index, 'largo', e.target.value)}
                          required
                        />
                      </TotalCell>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>
                      <TotalCell style={{ textAlign: 'center' }}>
                        <TableInputNumber
                          type="number"
                          step="0.01"
                          placeholder="H"
                          disabled={isSubmitting}
                          value={concepto.alto}
                          onChange={(e) => actualizarConcepto(index, 'alto', e.target.value)}
                          required
                        />
                      </TotalCell>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>
                      <TotalCell style={{ textAlign: 'center' }}>
                        <TableInputNumber
                          type="number"
                          step="0.01"
                          placeholder="N"
                          disabled={isSubmitting}
                          value={concepto.cantidad}
                          onChange={(e) => actualizarConcepto(index, 'cantidad', e.target.value)}
                        />
                      </TotalCell>
                    </TableCell>
                    <TableCell>
                      <TotalCell>{concepto.total || '0.00'}</TotalCell>
                    </TableCell>
                    <TableCell>
                      <DeleteRowButton type="button" onClick={() => eliminarConcepto(index)} disabled={isSubmitting}>
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

      <ButtonGroup>
        <Button as="button" type="submit" disabled={isSubmitting || conceptos.length === 0}>
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
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
`;

const HeaderSection = styled.div`
  background: rgb(var(--cardBackground));
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 2px solid rgba(var(--text), 0.25);
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

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
  min-width: 0;
  max-width: 100%;
`;

const HeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
  max-width: 100%;

  ${media('<=tablet')} {
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
  gap: 0.8rem;
  width: 100%;
  max-width: 100%;
  
  ${media('<=tablet')} {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  ${media('<=phone')} {
    align-items: stretch;
    width: 100%;
  }
`;

const ProjectLabel = styled.label`
  font-weight: bold;
  font-size: 1.3rem;
  color: rgb(var(--text));
  min-width: 10rem;
  flex-shrink: 0;
  
  ${media('<=tablet')} {
    min-width: auto;
    width: 100%;
  }

  ${media('<=phone')} {
    margin-bottom: 0.3rem;
    font-size: 1.2rem;
  }
`;

const ProjectValue = styled.div`
  flex: 1;
  min-width: 0;
  max-width: 100%;
  width: 100%;

  ${media('<=phone')} {
    flex: none;
    width: 100%;

    input, select {
      width: 100% !important;
      box-sizing: border-box;
    }
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: flex-end;
  text-align: right;
  width: 100%;
  max-width: 100%;
  min-width: 0;

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
  font-size: 1.4rem;
  color: rgb(var(--text));
  margin-bottom: 0.5rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;

  ${media('<=phone')} {
    font-size: 1.3rem;
    margin-bottom: 0.3rem;
    width: 100%;

    select, input {
      width: 100% !important;
      box-sizing: border-box;
    }
  }
`;

const CompanyDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
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
    max-width: 100%;

    ${media('<=phone')} {
      min-width: 100% !important;
      width: 100% !important;
      flex: none !important;
      display: block;
      box-sizing: border-box;
    }
  }

  label {
    min-width: 7rem;
    font-size: 1.3rem;
    margin-bottom: 0;
    flex-shrink: 0;
    
    ${media('<=tablet')} {
      min-width: auto;
      width: 100%;
    }

    ${media('<=phone')} {
      order: -1;
      margin-bottom: 0.3rem;
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
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

const StyledInput = styled(Input)`
  font-size: 1.3rem;
  padding: 0.9rem 1rem;
  border: 2px solid rgba(var(--text), 0.25);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  ${media('<=phone')} {
    font-size: 1.2rem;
    padding: 0.8rem 0.9rem;
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
  font-size: 1.3rem;
  padding: 0.9rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: rgb(var(--text));
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  ${media('<=phone')} {
    font-size: 1.2rem;
    padding: 0.8rem 0.9rem;
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

const TotalDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(var(--primary), 0.1);
  border-radius: 0.6rem;
  border: 2px solid rgb(var(--primary));
  margin-top: 1rem;
`;

const TotalLabel = styled.span`
  font-weight: bold;
  font-size: 1.6rem;
  color: rgb(var(--text));
`;

const TotalValue = styled.span`
  font-weight: bold;
  font-size: 2rem;
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
  padding: 3rem;
  color: rgba(var(--text), 0.6);
  font-size: 1.6rem;
  background: rgba(var(--text), 0.05);
  border-radius: 0.6rem;
  border: 2px dashed rgba(var(--text), 0.2);
`;

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 1rem;
  width: 100%;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  background: white;
  border: 2px solid rgba(var(--text), 0.2);
  table-layout: auto;
  min-width: 600px;

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
`;

const TableHeaderCellActividad = styled(TableHeaderCell)`
  width: 1%;
  white-space: nowrap;
`;

const TableCell = styled.td`
  padding: 0.5rem;
  border: 1px solid rgba(var(--text), 0.2);
  vertical-align: middle;
  white-space: nowrap;
`;

const TableInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid rgba(var(--text), 0.2);
  border-radius: 0.3rem;
  font-size: 1.3rem;
  background: transparent;
  transition: border-color 0.2s;

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
  padding: 0;
  border: none;
  border-radius: 0;
  font-size: 1.4rem;
  font-weight: bold;
  color: rgb(var(--primary));
  background: transparent;
  transition: border-color 0.2s;
  box-sizing: border-box;
  text-align: center;

  ${media('<=phone')} {
    font-size: 1.2rem;
  }

  &:focus {
    outline: none;
    border: none;
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(var(--text), 0.4);
    font-weight: normal;
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
