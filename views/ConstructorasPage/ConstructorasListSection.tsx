import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import AutofitGrid from 'components/AutofitGrid';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditConstructoraForm from './EditConstructoraForm';

interface Constructora {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  fechaCreacion: number;
}

export default function ConstructorasListSection() {
  const [constructoras, setConstructoras] = useState<Constructora[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentConstructora, setCurrentConstructora] = useState<Constructora | null>(null);

  useEffect(() => {
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    const db: Firestore = database;
    const constructorasCollection = collection(db, 'constructoras');
    
    // Intentar ordenar por fechaCreacion, pero si falla, cargar sin ordenar
    let constructorasQuery;
    try {
      constructorasQuery = query(constructorasCollection, orderBy('fechaCreacion', 'desc'));
    } catch (error) {
      console.warn('No se pudo ordenar por fechaCreacion, cargando sin ordenar:', error);
      constructorasQuery = constructorasCollection;
    }

    const unsubscribe = onSnapshot(constructorasQuery, (snapshot) => {
      try {
        const constructorasArray: Constructora[] = snapshot.docs.map((docSnapshot) => {
          const constructoraData = docSnapshot.data();
          return {
            id: docSnapshot.id,
            nombre: constructoraData?.nombre || '',
            direccion: constructoraData?.direccion || '',
            telefono: constructoraData?.telefono || '',
            email: constructoraData?.email || '',
            fechaCreacion: constructoraData?.fechaCreacion || Date.now(),
          };
        });
        // Ordenar manualmente si el query no pudo ordenar
        constructorasArray.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
        setConstructoras(constructorasArray);
        setLoading(false);
      } catch (error) {
        console.error('Error al procesar constructoras:', error);
        setConstructoras([]);
        setLoading(false);
      }
    }, (error: any) => {
      console.error('Error al cargar constructoras:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje de error:', error?.message);
      
      // Si el error es por falta de índice, intentar cargar sin ordenar
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Intentando cargar constructoras sin ordenar debido a falta de índice...');
        const constructorasQuerySimple = collection(db, 'constructoras');
        const unsubscribeSimple = onSnapshot(constructorasQuerySimple, (snapshot) => {
          try {
            const constructorasArray: Constructora[] = snapshot.docs.map((docSnapshot) => {
              const constructoraData = docSnapshot.data();
              return {
                id: docSnapshot.id,
                nombre: constructoraData?.nombre || '',
                direccion: constructoraData?.direccion || '',
                telefono: constructoraData?.telefono || '',
                email: constructoraData?.email || '',
                fechaCreacion: constructoraData?.fechaCreacion || Date.now(),
              };
            });
            // Ordenar manualmente
            constructorasArray.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
            setConstructoras(constructorasArray);
            setLoading(false);
          } catch (innerError) {
            console.error('Error al procesar constructoras (sin ordenar):', innerError);
            setConstructoras([]);
            setLoading(false);
          }
        }, (innerError: any) => {
          console.error('Error al cargar constructoras (sin ordenar):', innerError);
          setLoading(false);
          setConstructoras([]);
        });
        return () => unsubscribeSimple();
      } else {
        setLoading(false);
        setConstructoras([]);
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
    if (window.confirm('¿Estás seguro de que quieres eliminar esta constructora?')) {
      try {
        const constructoraDoc = doc(database, 'constructoras', id);
        await deleteDoc(constructoraDoc);
        console.log('Constructora eliminada:', id);
      } catch (error) {
        console.error('Error al eliminar constructora:', error);
        alert('Error al eliminar la constructora. Por favor, intenta de nuevo.');
      }
    }
  };

  const handleEdit = (constructora: Constructora) => {
    setCurrentConstructora(constructora);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentConstructora(null);
  };

  if (loading) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Constructoras</SectionTitle>
        <EmptyState>Cargando constructoras...</EmptyState>
      </Wrapper>
    );
  }

  if (constructoras.length === 0) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Constructoras</SectionTitle>
        <EmptyState>No hay constructoras registradas. Añade una usando el formulario de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionTitle>Lista de Constructoras ({constructoras.length})</SectionTitle>
      <AutofitGrid>
        {constructoras.map((constructora) => (
          <ConstructoraCard key={constructora.id}>
            <CardHeader>
              <ConstructoraName>{constructora.nombre}</ConstructoraName>
              <ButtonGroup>
                <EditButton onClick={() => handleEdit(constructora)}>✏️</EditButton>
                <DeleteButton onClick={() => handleDelete(constructora.id)}>×</DeleteButton>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              {constructora.direccion && (
                <InfoRow>
                  <Label>Dirección:</Label>
                  <Value>{constructora.direccion}</Value>
                </InfoRow>
              )}
              {constructora.telefono && (
                <InfoRow>
                  <Label>Teléfono:</Label>
                  <Value>{constructora.telefono}</Value>
                </InfoRow>
              )}
              {constructora.email && (
                <InfoRow>
                  <Label>Email:</Label>
                  <Value>{constructora.email}</Value>
                </InfoRow>
              )}
            </CardContent>
          </ConstructoraCard>
        ))}
      </AutofitGrid>
      {currentConstructora && (
        <EditModal isOpen={isEditModalOpen} onClose={handleCloseModal} title={`Editar Constructora: ${currentConstructora.nombre}`}>
          <EditConstructoraForm constructora={currentConstructora} onClose={handleCloseModal} />
        </EditModal>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const ConstructoraCard = styled.div`
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
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(var(--text), 0.1);
`;

const ConstructoraName = styled.h3`
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  color: rgb(var(--primary));
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
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
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgb(var(--text));
  opacity: 0.6;
  font-size: 1.8rem;
`;

