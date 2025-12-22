import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
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

interface ConstructorasListSectionProps {
  onShowForm?: () => void;
}

export default function ConstructorasListSection({ onShowForm }: ConstructorasListSectionProps) {
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
        <HeaderRow>
          <SectionTitle>Lista de Constructoras</SectionTitle>
          {onShowForm && (
            <AddButton onClick={onShowForm}>
              + Añadir Nueva Constructora
            </AddButton>
          )}
        </HeaderRow>
        <EmptyState>Cargando constructoras...</EmptyState>
      </Wrapper>
    );
  }

  if (constructoras.length === 0) {
    return (
      <Wrapper>
        <HeaderRow>
          <SectionTitle>Lista de Constructoras</SectionTitle>
          {onShowForm && (
            <AddButton onClick={onShowForm}>
              + Añadir Nueva Constructora
            </AddButton>
          )}
        </HeaderRow>
        <EmptyState>No hay constructoras registradas. Añade una usando el botón de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderRow>
        <SectionTitle>Lista de Constructoras</SectionTitle>
        {onShowForm && (
          <AddButton onClick={onShowForm}>
            + Añadir Nueva Constructora
          </AddButton>
        )}
      </HeaderRow>
      <ConstructorasGrid>
        {constructoras.map((constructora) => (
          <ConstructoraCard key={constructora.id}>
            <CardHeader>
              <HeaderContent>
                <HeaderLeft>
                  <HeaderTitle>CONSTRUCTORA</HeaderTitle>
                  <ProjectInfo>
                    <ProjectRow>
                      <ProjectLabel>Nombre:</ProjectLabel>
                      <ProjectValue>{constructora.nombre}</ProjectValue>
                    </ProjectRow>
                  </ProjectInfo>
                </HeaderLeft>
                <ButtonGroup>
                  <EditButton onClick={() => handleEdit(constructora)}>✏️</EditButton>
                  <DeleteButton onClick={() => handleDelete(constructora.id)}>×</DeleteButton>
                </ButtonGroup>
              </HeaderContent>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody>
                    {constructora.direccion && (
                      <TableRow>
                        <TableCell><Label>Dirección:</Label></TableCell>
                        <TableCell>{constructora.direccion}</TableCell>
                      </TableRow>
                    )}
                    {constructora.telefono && (
                      <TableRow>
                        <TableCell><Label>Teléfono:</Label></TableCell>
                        <TableCell>{constructora.telefono}</TableCell>
                      </TableRow>
                    )}
                    {constructora.email && (
                      <TableRow>
                        <TableCell><Label>Email:</Label></TableCell>
                        <TableCell>{constructora.email}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </ConstructoraCard>
        ))}
      </ConstructorasGrid>
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

const ConstructorasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  gap: 2rem;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
  }
`;

const ConstructoraCard = styled.div`
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
  padding-bottom: 1rem;
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

const HeaderTitle = styled.h3`
  font-size: 1.9rem;
  font-weight: 700;
  color: rgb(var(--primary));
  margin: 0 0 1rem 0;
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

  ${media('<=phone')} {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
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
  min-width: 400px;

  ${media('<=phone')} {
    min-width: 350px;
    font-size: 1.2rem;
  }
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
    min-width: 15rem;
    background: rgba(var(--primary), 0.05);

    ${media('<=phone')} {
      min-width: 12rem;
    }
  }

  &:last-child {
    font-weight: 400;
  }
`;

const Label = styled.span`
  font-weight: bold;
  color: rgb(var(--text));
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgb(var(--text));
  opacity: 0.6;
  font-size: 1.8rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;

  ${media('<=tablet')} {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const AddButton = styled.button`
  background: rgb(var(--primary));
  color: rgb(var(--textSecondary));
  border: 2px solid rgb(var(--primary));
  padding: 1rem 2rem;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 0.4rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: transform 0.2s, background 0.2s;
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    background: rgba(var(--primary), 0.9);
  }

  ${media('<=phone')} {
    width: 100%;
    font-size: 1.2rem;
    padding: 0.8rem 1.5rem;
  }
`;


