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
  concepto: string;
  largo: string;
  alto: string;
  cantidad: string;
  total: string;
  observaciones?: string;
}

interface Medicion {
  id: string;
  empresa: string;
  obra: string;
  fecha: string;
  conceptos?: ConceptoItem[]; // Nueva estructura con array de conceptos
  // Campos legacy para compatibilidad con datos antiguos
  concepto?: string;
  largo?: string;
  alto?: string;
  cantidad?: string;
  total?: string;
  observaciones?: string;
  fechaCreacion: number;
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
            empresa: medicionData?.empresa || '',
            obra: medicionData?.obra || '',
            fecha: medicionData?.fecha || '',
            conceptos: medicionData?.conceptos || undefined, // Nueva estructura
            // Campos legacy para compatibilidad
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
      // Si viene con conceptos, asegurarse de limpiar campos legacy
      if (updatedData.conceptos) {
        const dataToUpdate: any = {
          empresa: updatedData.empresa,
          obra: updatedData.obra,
          fecha: updatedData.fecha,
          conceptos: updatedData.conceptos,
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
      <SectionTitle>Lista de Hojas de Mediciones ({mediciones.length})</SectionTitle>
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
      <AutofitGrid>
        {mediciones.map((medicion) => (
          <MedicionCard key={medicion.id}>
            <CardHeader>
              <HeaderInfo>
                {medicion.concepto && (
                  <HeaderItem style={{ width: '100%', marginBottom: '1rem' }}>
                    <HeaderLabel>Concepto:</HeaderLabel>
                    <HeaderValue>{medicion.concepto}</HeaderValue>
                  </HeaderItem>
                )}
                <HeaderItem>
                  <HeaderLabel>Empresa:</HeaderLabel>
                  <HeaderValue>{medicion.empresa}</HeaderValue>
                </HeaderItem>
                <HeaderItem>
                  <HeaderLabel>Obra:</HeaderLabel>
                  <HeaderValue>{medicion.obra}</HeaderValue>
                </HeaderItem>
                <HeaderItem>
                  <HeaderLabel>Fecha:</HeaderLabel>
                  <HeaderValue>{medicion.fecha ? new Date(medicion.fecha).toLocaleDateString('es-ES') : 'N/A'}</HeaderValue>
                </HeaderItem>
              </HeaderInfo>
              <ButtonGroup>
                <EditButton onClick={() => handleEdit(medicion)}>✏️</EditButton>
                <DeleteButton onClick={() => handleDelete(medicion.id)}>×</DeleteButton>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              {medicion.conceptos && medicion.conceptos.length > 0 ? (
                // Nueva estructura: mostrar lista de conceptos
                <ConceptosList>
                  <ConceptosTitle>Mediciones ({medicion.conceptos.length}):</ConceptosTitle>
                  {medicion.conceptos.map((concepto, idx) => (
                    <ConceptoItem key={idx}>
                      <ConceptoHeader>
                        <ConceptoLabel>Concepto #{idx + 1}: {concepto.concepto}</ConceptoLabel>
                      </ConceptoHeader>
                      <ConceptoDetails>
                        <InfoRow>
                          <Label>Largo:</Label>
                          <Value>{concepto.largo}</Value>
                        </InfoRow>
                        <InfoRow>
                          <Label>Alto:</Label>
                          <Value>{concepto.alto}</Value>
                        </InfoRow>
                        <InfoRow>
                          <Label>Cantidad:</Label>
                          <Value>{concepto.cantidad || '1'}</Value>
                        </InfoRow>
                        <InfoRow>
                          <Label>Total:</Label>
                          <TotalValue>{concepto.total}</TotalValue>
                        </InfoRow>
                        {concepto.observaciones && (
                          <InfoRow>
                            <Label>Observaciones:</Label>
                            <Value>{concepto.observaciones}</Value>
                          </InfoRow>
                        )}
                      </ConceptoDetails>
                    </ConceptoItem>
                  ))}
                </ConceptosList>
              ) : (
                // Estructura legacy: mostrar un solo concepto
                <>
                  {medicion.concepto && (
                    <InfoRow>
                      <Label>Concepto:</Label>
                      <Value>{medicion.concepto}</Value>
                    </InfoRow>
                  )}
                  {medicion.largo && (
                    <InfoRow>
                      <Label>Largo:</Label>
                      <Value>{medicion.largo}</Value>
                    </InfoRow>
                  )}
                  {medicion.alto && (
                    <InfoRow>
                      <Label>Alto:</Label>
                      <Value>{medicion.alto}</Value>
                    </InfoRow>
                  )}
                  {medicion.cantidad && (
                    <InfoRow>
                      <Label>Cantidad:</Label>
                      <Value>{medicion.cantidad}</Value>
                    </InfoRow>
                  )}
                  {medicion.total && (
                    <InfoRow>
                      <Label>Total:</Label>
                      <TotalValue>{medicion.total}</TotalValue>
                    </InfoRow>
                  )}
                  {medicion.observaciones && (
                    <InfoRow>
                      <Label>Observaciones:</Label>
                      <Value>{medicion.observaciones}</Value>
                    </InfoRow>
                  )}
                </>
              )}
            </CardContent>
          </MedicionCard>
        ))}
      </AutofitGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const MedicionCard = styled.div`
  padding: 2.5rem;
  background: rgb(var(--cardBackground));
  box-shadow: var(--shadow-md);
  border-radius: 0.6rem;
  color: rgb(var(--text));
  font-size: 1.6rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(var(--text), 0.1);
  gap: 1rem;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex: 1;
`;

const HeaderItem = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const HeaderLabel = styled.span`
  font-weight: bold;
  font-size: 1.5rem;
  opacity: 0.7;
  min-width: 8rem;
`;

const HeaderValue = styled.span`
  font-size: 1.6rem;
  font-weight: 600;
  color: rgb(var(--primary));
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const EditButton = styled.button`
  background: rgb(var(--primary));
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  font-size: 1.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const DeleteButton = styled.button`
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

  &:hover {
    transform: scale(1.1);
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  gap: 1rem;
`;

const Label = styled.span`
  font-weight: bold;
  opacity: 0.7;
  flex-shrink: 0;
  min-width: 12rem;
`;

const Value = styled.span`
  text-align: right;
  opacity: 0.9;
  word-break: break-word;
`;

const TotalValue = styled.span`
  text-align: right;
  font-weight: bold;
  font-size: 1.8rem;
  color: rgb(var(--primary));
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgb(var(--text));
  opacity: 0.6;
  font-size: 1.8rem;
`;

const ConceptosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ConceptosTitle = styled.h4`
  font-size: 1.8rem;
  font-weight: bold;
  color: rgb(var(--primary));
  margin-bottom: 1rem;
`;

const ConceptoItem = styled.div`
  background: rgba(var(--primary), 0.05);
  padding: 1.5rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(var(--primary), 0.2);
`;

const ConceptoHeader = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(var(--text), 0.1);
`;

const ConceptoLabel = styled.span`
  font-weight: bold;
  font-size: 1.6rem;
  color: rgb(var(--primary));
`;

const ConceptoDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

