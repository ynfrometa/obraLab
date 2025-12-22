import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import AutofitGrid from 'components/AutofitGrid';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditMedicionForm from './EditMedicionForm';

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
  conceptos?: ConceptoItem[]; // Nueva estructura con array de conceptos
  // Campos legacy para compatibilidad con datos antiguos
  empresa?: string;
  concepto?: string;
  largo?: string;
  alto?: string;
  cantidad?: string;
  total?: string;
  observaciones?: string;
  fechaCreacion?: number;
}

export default function MedicionesListSection() {
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMedicion, setEditingMedicion] = useState<Medicion | null>(null);

  useEffect(() => {
    // Verificar que database esté inicializado
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    // Referencia a la colección de Firestore (colección: mediciones)
    const db: Firestore = database;
    const medicionesCollection = collection(db, 'mediciones');
    const medicionesQuery = query(medicionesCollection, orderBy('fechaCreacion', 'desc'));
    console.log('Iniciando escucha en colección: mediciones');

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(medicionesQuery, (snapshot) => {
      console.log('=== DATOS DE FIRESTORE ===');
      console.log('Colección consultada: mediciones');
      console.log('Número de documentos:', snapshot.size);
      
      try {
        const medicionesArray: Medicion[] = snapshot.docs.map((docSnapshot) => {
          const medicionData = docSnapshot.data();
          console.log(`Procesando medición ${docSnapshot.id}:`, medicionData);
          
          return {
            id: docSnapshot.id,
            empresaNombre: medicionData?.empresaNombre || medicionData?.empresa || '',
            empresaEmail: medicionData?.empresaEmail || '',
            empresaTelefono1: medicionData?.empresaTelefono1 || '',
            empresaTelefono2: medicionData?.empresaTelefono2 || '',
            constructora: medicionData?.constructora || '',
            obra: Array.isArray(medicionData?.obra) ? medicionData.obra : (medicionData?.obra || ''),
            fecha: medicionData?.fecha || '',
            conceptos: medicionData?.conceptos || undefined, // Nueva estructura
            // Campos legacy para compatibilidad
            empresa: medicionData?.empresa || medicionData?.empresaNombre || '',
            concepto: medicionData?.concepto || undefined,
            largo: medicionData?.largo || undefined,
            alto: medicionData?.alto || undefined,
            cantidad: medicionData?.cantidad || undefined,
            total: medicionData?.total || undefined,
            observaciones: medicionData?.observaciones || undefined,
            fechaCreacion: medicionData?.fechaCreacion || Date.now(),
          };
        });
        
        console.log('Mediciones procesadas:', medicionesArray);
        console.log('Total de mediciones a mostrar:', medicionesArray.length);
        setMediciones(medicionesArray);
      } catch (error) {
        console.error('Error al procesar mediciones:', error);
        setMediciones([]);
      }
      setLoading(false);
    }, (error: any) => {
      console.error('=== ERROR AL CARGAR MEDICIONES ===');
      console.error('Error completo:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje:', error?.message);
      
      if (error?.code === 'permission-denied') {
        console.error('⚠️ ERROR DE PERMISOS: Necesitas configurar las reglas de Firestore');
        console.error('Ve a Firebase Console → Firestore Database → Rules');
        console.error('Y configura: allow read, write: if true;');
      }
      
      setLoading(false);
      setMediciones([]);
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!database) {
      alert('Firebase no está inicializado');
      return;
    }
    if (!confirm('¿Estás seguro de que quieres eliminar esta hoja de mediciones?')) {
      return;
    }
    try {
      const medicionDoc = doc(database, 'mediciones', id);
      await deleteDoc(medicionDoc);
      console.log('Medición eliminada:', id);
    } catch (error) {
      console.error('Error al eliminar medición:', error);
      alert('Error al eliminar la hoja de mediciones. Por favor, intenta de nuevo.');
    }
  };

  const handleEdit = (medicion: Medicion) => {
    setEditingMedicion(medicion);
  };

  const handleCloseEdit = () => {
    setEditingMedicion(null);
  };

  const handleUpdate = async (updatedData: any) => {
    if (!database || !editingMedicion) return;
    
    try {
      const medicionDoc = doc(database, 'mediciones', editingMedicion.id);
      // Si viene con conceptos, asegurarse de incluir todos los campos nuevos
      if (updatedData.conceptos) {
        const dataToUpdate: any = {
          empresaNombre: updatedData.empresaNombre || updatedData.empresa,
          empresaEmail: updatedData.empresaEmail || '',
          empresaTelefono1: updatedData.empresaTelefono1 || '',
          empresaTelefono2: updatedData.empresaTelefono2 || '',
          constructora: updatedData.constructora || '',
          obra: updatedData.obra,
          fecha: updatedData.fecha,
          conceptos: updatedData.conceptos,
          // Mantener compatibilidad
          empresa: updatedData.empresaNombre || updatedData.empresa,
        };
        await updateDoc(medicionDoc, dataToUpdate);
      } else {
        await updateDoc(medicionDoc, updatedData);
      }
      console.log('Medición actualizada:', editingMedicion.id);
      setEditingMedicion(null);
    } catch (error) {
      console.error('Error al actualizar medición:', error);
      alert('Error al actualizar la hoja de mediciones. Por favor, intenta de nuevo.');
    }
  };

  // Funciones de exportación con importación dinámica para evitar problemas con SSR
  const handleExportExcel = async (medicion: Medicion) => {
    try {
      const { exportToExcel } = await import('utils/exportMedicion');
      exportToExcel(medicion);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel. Por favor, intenta de nuevo.');
    }
  };

  const handleExportPDF = async (medicion: Medicion) => {
    try {
      const { exportToPDF } = await import('utils/exportMedicion');
      exportToPDF(medicion);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Error al exportar a PDF. Por favor, intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Hojas de Mediciones</SectionTitle>
        <EmptyState>Cargando mediciones...</EmptyState>
      </Wrapper>
    );
  }

  if (mediciones.length === 0) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Hojas de Mediciones</SectionTitle>
        <EmptyState>No hay hojas de mediciones registradas. Añade una usando el formulario de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionTitle>Lista de Hojas de Mediciones</SectionTitle>
      <EditModal
        isOpen={!!editingMedicion}
        onClose={handleCloseEdit}
        title="Editar Hoja de Mediciones"
      >
        {editingMedicion && (
          <EditMedicionForm
            medicion={editingMedicion}
            onSave={handleUpdate}
            onCancel={handleCloseEdit}
          />
        )}
      </EditModal>
      <MedicionesGrid>
        {mediciones.map((medicion) => (
          <MedicionCard key={medicion.id}>
            <CardHeader>
              <HeaderTitle>HOJA DE MEDICIONES</HeaderTitle>
              <HeaderContent>
                <HeaderLeft>
                  <ProjectInfo>
                    <ProjectRow>
                      <ProjectLabel>Constructora:</ProjectLabel>
                      <ProjectValue>{medicion.constructora || 'N/A'}</ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Obra:</ProjectLabel>
                      <ProjectValue>
                        {medicion.obra 
                          ? (() => {
                              // Si es un array, unir con espacios
                              if (Array.isArray(medicion.obra)) {
                                return medicion.obra.filter(Boolean).join(' ');
                              }
                              // Si es string, mostrar tal cual
                              return medicion.obra;
                            })()
                          : 'N/A'}
                      </ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Fecha:</ProjectLabel>
                      <ProjectValue>
                        {medicion.fecha 
                          ? (() => {
                              const fecha = new Date(medicion.fecha + 'T00:00:00');
                              const day = String(fecha.getDate()).padStart(2, '0');
                              const month = String(fecha.getMonth() + 1).padStart(2, '0');
                              const year = fecha.getFullYear();
                              return `${day}/${month}/${year}`;
                            })()
                          : 'N/A'}
                      </ProjectValue>
                    </ProjectRow>
                  </ProjectInfo>
                </HeaderLeft>
                <HeaderRight>
                  <CompanyInfo>
                    <CompanyNameWrapper>
                      <CompanyName>{medicion.empresaNombre || medicion.empresa}</CompanyName>
                      <ButtonGroup>
                        <EditButton onClick={() => handleEdit(medicion)}>✏️</EditButton>
                        <DeleteButton onClick={() => handleDelete(medicion.id)}>×</DeleteButton>
                      </ButtonGroup>
                    </CompanyNameWrapper>
                    <ExportButtonsGroup>
                      <ExportButton onClick={() => handleExportExcel(medicion)} title="Exportar a Excel">
                        📊 Excel
                      </ExportButton>
                      <ExportButton onClick={() => handleExportPDF(medicion)} title="Exportar a PDF">
                        📄 PDF
                      </ExportButton>
                    </ExportButtonsGroup>
                    {medicion.empresaEmail && (
                      <CompanyDetail>Email: {medicion.empresaEmail}</CompanyDetail>
                    )}
                    {(medicion.empresaTelefono1 || medicion.empresaTelefono2) && (
                      <CompanyDetail>
                        {[medicion.empresaTelefono1, medicion.empresaTelefono2].filter(Boolean).join(', ')}
                      </CompanyDetail>
                    )}
                  </CompanyInfo>
                </HeaderRight>
              </HeaderContent>
            </CardHeader>
            <CardContent>
              {medicion.conceptos && medicion.conceptos.length > 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicion.conceptos.map((concepto, idx) => (
                        <TableRow key={idx}>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>{concepto.actividad || ''}</TableCell>
                          <TableCell>{concepto.concepto}</TableCell>
                          <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>{concepto.largo}</TableCell>
                          <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>{concepto.alto}</TableCell>
                          <TableCell style={{ textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '0.5rem' }}>{concepto.cantidad || '1'}</TableCell>
                          <TableCell style={{ textAlign: 'right' }}>
                            <TotalValue>{concepto.total || '0.00'}</TotalValue>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyTableMessage>No hay mediciones registradas</EmptyTableMessage>
              )}
            </CardContent>
          </MedicionCard>
        ))}
      </MedicionesGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const MedicionesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  gap: 2rem;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
  }
`;

const MedicionCard = styled.div`
  padding: 2rem;
  background: rgb(var(--cardBackground));
  box-shadow: var(--shadow-md);
  border-radius: 0.6rem;
  color: rgb(var(--text));
  font-size: 1.6rem;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(var(--text), 0.1);

  ${media('<=phone')} {
    padding: 1.5rem;
    font-size: 1.4rem;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(var(--text), 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  position: relative;

  ${media('<=tablet')} {
    flex-direction: column;
    gap: 1.5rem;
  }

  ${media('<=phone')} {
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  text-align: right;
  min-width: 25rem;

  ${media('<=tablet')} {
    min-width: auto;
    width: 100%;
    text-align: left;
  }

  ${media('<=phone')} {
    justify-content: flex-start;
  }
`;

const HeaderTitle = styled.h3`
  font-size: 1.9rem;
  font-weight: 700;
  color: rgb(var(--primary));
  margin: 0 0 1.5rem 0;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const ProjectRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;

  ${media('<=phone')} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.3rem;
    width: 100%;
  }
`;

const ProjectLabel = styled.span`
  font-weight: 600;
  font-size: 1.5rem;
  color: rgb(var(--text));
  min-width: 12rem;
  letter-spacing: 0.01em;

  ${media('<=phone')} {
    min-width: auto;
    font-size: 1.3rem;
    width: 100%;
  }
`;

const ProjectValue = styled.span`
  font-size: 1.5rem;
  font-weight: 500;
  color: rgb(var(--text));
  line-height: 1.6;
  letter-spacing: 0.01em;

  ${media('<=phone')} {
    font-size: 1.3rem;
    width: 100%;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
  width: 100%;

  ${media('<=tablet')} {
    align-items: flex-start;
    width: 100%;
  }

  ${media('<=phone')} {
    gap: 0.4rem;
    width: 100%;
  }
`;

const CompanyNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const CompanyName = styled.div`
  font-weight: bold;
  font-size: 1.6rem;
  color: rgb(var(--text));
`;

const CompanyDetail = styled.div`
  font-size: 1.3rem;
  color: rgb(var(--text));
  opacity: 0.9;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  align-items: center;
`;

const EditButton = styled.button`
  background: rgb(var(--primary));
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, opacity 0.2s;
  padding: 0;

  &:hover {
    transform: scale(1.1);
    opacity: 0.9;
  }
`;

const DeleteButton = styled.button`
  background: rgb(var(--errorColor));
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, opacity 0.2s;
  padding: 0;
  line-height: 1;

  &:hover {
    transform: scale(1.1);
    opacity: 0.9;
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 1rem;
  -webkit-overflow-scrolling: touch;

  ${media('<=phone')} {
    margin-left: -1.5rem;
    margin-right: -1.5rem;
    padding: 0 1.5rem;
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
  width: 1%;
  white-space: nowrap;
`;

const TableCell = styled.td`
  padding: 1rem 1.2rem;
  border: 1px solid rgba(var(--text), 0.2);
  vertical-align: middle;
  font-size: 1.4rem;
  line-height: 1.5;
  letter-spacing: 0.01em;

  ${media('<=phone')} {
    padding: 0.8rem 0.5rem;
    font-size: 1.2rem;
  }

  &:first-child {
    font-weight: 600;
  }

  &:last-child {
    font-weight: 400;
  }
`;

const TotalValue = styled.span`
  font-weight: bold;
  font-size: 1.4rem;
  color: rgb(var(--primary));
`;

const EmptyTableMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: rgba(var(--text), 0.6);
  font-size: 1.4rem;
  background: rgba(var(--text), 0.05);
  border-radius: 0.5rem;
  border: 2px dashed rgba(var(--text), 0.25);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgb(var(--text));
  opacity: 0.6;
  font-size: 1.8rem;
`;

const ExportButtonsGroup = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  justify-content: flex-end;

  ${media('<=tablet')} {
    justify-content: flex-start;
  }

  ${media('<=phone')} {
    flex-direction: column;
    width: 100%;
  }
`;

const ExportButton = styled.button`
  background: rgb(var(--primary));
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.8rem 1.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, opacity 0.2s;
  white-space: nowrap;

  ${media('<=phone')} {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
  }

  &:hover {
    transform: translateY(-2px);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

