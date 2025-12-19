import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import AutofitGrid from 'components/AutofitGrid';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditActividadForm from './EditActividadForm';

interface Actividad {
  id: string;
  descripcion: string;
  fechaCreacion: number;
}

export default function ActividadesListSection() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentActividad, setCurrentActividad] = useState<Actividad | null>(null);

  useEffect(() => {
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    const db: Firestore = database;
    const actividadesCollection = collection(db, 'actividades');
    
    // Intentar ordenar por fechaCreacion, pero si falla, cargar sin ordenar
    let actividadesQuery;
    try {
      actividadesQuery = query(actividadesCollection, orderBy('fechaCreacion', 'desc'));
    } catch (error) {
      console.warn('No se pudo ordenar por fechaCreacion, cargando sin ordenar:', error);
      actividadesQuery = actividadesCollection;
    }

    const unsubscribe = onSnapshot(actividadesQuery, (snapshot) => {
      try {
        const actividadesArray: Actividad[] = snapshot.docs.map((docSnapshot) => {
          const actividadData = docSnapshot.data();
          return {
            id: docSnapshot.id,
            descripcion: actividadData?.descripcion || '',
            fechaCreacion: actividadData?.fechaCreacion || Date.now(),
          };
        });
        // Ordenar manualmente si el query no pudo ordenar
        actividadesArray.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
        setActividades(actividadesArray);
        setLoading(false);
      } catch (error) {
        console.error('Error al procesar actividades:', error);
        setActividades([]);
        setLoading(false);
      }
    }, (error: any) => {
      console.error('Error al cargar actividades:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje de error:', error?.message);
      
      // Si el error es por falta de índice, intentar cargar sin ordenar
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Intentando cargar actividades sin ordenar debido a falta de índice...');
        const actividadesQuerySimple = collection(db, 'actividades');
        const unsubscribeSimple = onSnapshot(actividadesQuerySimple, (snapshot) => {
          try {
            const actividadesArray: Actividad[] = snapshot.docs.map((docSnapshot) => {
              const actividadData = docSnapshot.data();
              return {
                id: docSnapshot.id,
                descripcion: actividadData?.descripcion || '',
                fechaCreacion: actividadData?.fechaCreacion || Date.now(),
              };
            });
            // Ordenar manualmente
            actividadesArray.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
            setActividades(actividadesArray);
            setLoading(false);
          } catch (innerError) {
            console.error('Error al procesar actividades (sin ordenar):', innerError);
            setActividades([]);
            setLoading(false);
          }
        }, (innerError: any) => {
          console.error('Error al cargar actividades (sin ordenar):', innerError);
          setLoading(false);
          setActividades([]);
        });
        return () => unsubscribeSimple();
      } else {
        setLoading(false);
        setActividades([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!database) {
      alert('Firebase no está inicializado');
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        const actividadDoc = doc(database, 'actividades', id);
        await deleteDoc(actividadDoc);
        console.log('Actividad eliminada:', id);
      } catch (error) {
        console.error('Error al eliminar actividad:', error);
        alert('Error al eliminar la actividad. Por favor, intenta de nuevo.');
      }
    }
  };

  const handleEdit = (actividad: Actividad) => {
    setCurrentActividad(actividad);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentActividad(null);
  };

  if (loading) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Actividades</SectionTitle>
        <EmptyState>Cargando actividades...</EmptyState>
      </Wrapper>
    );
  }

  if (actividades.length === 0) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Actividades</SectionTitle>
        <EmptyState>No hay actividades registradas. Añade una usando el formulario de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionTitle>Lista de Actividades ({actividades.length})</SectionTitle>
      <AutofitGrid>
        {actividades.map((actividad) => (
          <ActividadCard key={actividad.id}>
            <CardHeader>
              <Descripcion>{actividad.descripcion}</Descripcion>
              <ButtonGroup>
                <EditButton onClick={() => handleEdit(actividad)}>✏️</EditButton>
                <DeleteButton onClick={() => handleDelete(actividad.id)}>×</DeleteButton>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              <InfoRow>
                <Label>Fecha de Creación:</Label>
                <Value>
                  {new Date(actividad.fechaCreacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Value>
              </InfoRow>
            </CardContent>
          </ActividadCard>
        ))}
      </AutofitGrid>
      {currentActividad && (
        <EditModal isOpen={isEditModalOpen} onClose={handleCloseModal} title={`Editar Actividad`}>
          <EditActividadForm actividad={currentActividad} onClose={handleCloseModal} />
        </EditModal>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const ActividadCard = styled.div`
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
  border-bottom: 1px solid rgba(var(--text), 0.1);
  gap: 1rem;
`;

const Descripcion = styled.h3`
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1.6;
  color: rgb(var(--primary));
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  flex: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
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
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
`;

const Label = styled.span`
  font-weight: bold;
  opacity: 0.7;
`;

const Value = styled.span`
  text-align: right;
  opacity: 0.9;
  font-size: 1.4rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgb(var(--text));
  opacity: 0.6;
  font-size: 1.8rem;
`;

