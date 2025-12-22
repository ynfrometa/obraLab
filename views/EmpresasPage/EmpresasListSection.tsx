import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditEmpresaForm from './EditEmpresaForm';

interface Empresa {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  telefono2?: string;
  email?: string;
  fechaCreacion: number;
}

interface EmpresasListSectionProps {
  onShowForm?: () => void;
}

export default function EmpresasListSection({ onShowForm }: EmpresasListSectionProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmpresa, setCurrentEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    const db: Firestore = database;
    const empresasCollection = collection(db, 'empresas');
    
    // Intentar ordenar por fechaCreacion, pero si falla, cargar sin ordenar
    let empresasQuery;
    try {
      empresasQuery = query(empresasCollection, orderBy('fechaCreacion', 'desc'));
    } catch (error) {
      console.warn('No se pudo ordenar por fechaCreacion, cargando sin ordenar:', error);
      empresasQuery = empresasCollection;
    }

    const unsubscribe = onSnapshot(empresasQuery, (snapshot) => {
      try {
        const empresasArray: Empresa[] = snapshot.docs.map((docSnapshot) => {
          const empresaData = docSnapshot.data();
          return {
            id: docSnapshot.id,
            nombre: empresaData?.nombre || '',
            direccion: empresaData?.direccion || '',
            telefono: empresaData?.telefono || '',
            telefono2: empresaData?.telefono2 || '',
            email: empresaData?.email || '',
            fechaCreacion: empresaData?.fechaCreacion || Date.now(),
          };
        });
        // Ordenar manualmente si el query no pudo ordenar
        empresasArray.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
        setEmpresas(empresasArray);
        setLoading(false);
      } catch (error) {
        console.error('Error al procesar empresas:', error);
        setEmpresas([]);
        setLoading(false);
      }
    }, (error: any) => {
      console.error('Error al cargar empresas:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje de error:', error?.message);
      
      // Si el error es por falta de índice, intentar cargar sin ordenar
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Intentando cargar empresas sin ordenar debido a falta de índice...');
        const empresasQuerySimple = collection(db, 'empresas');
        const unsubscribeSimple = onSnapshot(empresasQuerySimple, (snapshot) => {
          try {
            const empresasArray: Empresa[] = snapshot.docs.map((docSnapshot) => {
              const empresaData = docSnapshot.data();
              return {
                id: docSnapshot.id,
                nombre: empresaData?.nombre || '',
                direccion: empresaData?.direccion || '',
                telefono: empresaData?.telefono || '',
                email: empresaData?.email || '',
                fechaCreacion: empresaData?.fechaCreacion || Date.now(),
              };
            });
            // Ordenar manualmente
            empresasArray.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
            setEmpresas(empresasArray);
            setLoading(false);
          } catch (innerError) {
            console.error('Error al procesar empresas (sin ordenar):', innerError);
            setEmpresas([]);
            setLoading(false);
          }
        }, (innerError: any) => {
          console.error('Error al cargar empresas (sin ordenar):', innerError);
          setLoading(false);
          setEmpresas([]);
        });
        return () => unsubscribeSimple();
      } else {
        setLoading(false);
        setEmpresas([]);
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
    if (window.confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      try {
        const empresaDoc = doc(database, 'empresas', id);
        await deleteDoc(empresaDoc);
        console.log('Empresa eliminada:', id);
      } catch (error) {
        console.error('Error al eliminar empresa:', error);
        alert('Error al eliminar la empresa. Por favor, intenta de nuevo.');
      }
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setCurrentEmpresa(empresa);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentEmpresa(null);
  };

  if (loading) {
    return (
      <Wrapper>
        <HeaderRow>
          <SectionTitle>Lista de Empresas</SectionTitle>
          {onShowForm && (
            <AddButton onClick={onShowForm}>
              + Añadir Nueva Empresa
            </AddButton>
          )}
        </HeaderRow>
        <EmptyState>Cargando empresas...</EmptyState>
      </Wrapper>
    );
  }

  if (empresas.length === 0) {
    return (
      <Wrapper>
        <HeaderRow>
          <SectionTitle>Lista de Empresas</SectionTitle>
          {onShowForm && (
            <AddButton onClick={onShowForm}>
              + Añadir Nueva Empresa
            </AddButton>
          )}
        </HeaderRow>
        <EmptyState>No hay empresas registradas. Añade una usando el botón de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderRow>
        <SectionTitle>Lista de Empresas</SectionTitle>
        {onShowForm && (
          <AddButton onClick={onShowForm}>
            + Añadir Nueva Empresa
          </AddButton>
        )}
      </HeaderRow>
      <EmpresasGrid>
        {empresas.map((empresa) => (
          <EmpresaCard key={empresa.id}>
            <CardHeader>
              <HeaderContent>
                <HeaderLeft>
                  <HeaderTitle>EMPRESA</HeaderTitle>
                  <ProjectInfo>
                    <ProjectRow>
                      <ProjectLabel>Nombre:</ProjectLabel>
                      <ProjectValue>{empresa.nombre}</ProjectValue>
                    </ProjectRow>
                  </ProjectInfo>
                </HeaderLeft>
                <ButtonGroup>
                  <EditButton onClick={() => handleEdit(empresa)}>✏️</EditButton>
                  <DeleteButton onClick={() => handleDelete(empresa.id)}>×</DeleteButton>
                </ButtonGroup>
              </HeaderContent>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody>
                    {empresa.direccion && (
                      <TableRow>
                        <TableCell><Label>Dirección:</Label></TableCell>
                        <TableCell>{empresa.direccion}</TableCell>
                      </TableRow>
                    )}
                    {(empresa.telefono || empresa.telefono2) && (
                      <TableRow>
                        <TableCell><Label>Teléfonos:</Label></TableCell>
                        <TableCell>
                          {[empresa.telefono, empresa.telefono2].filter(Boolean).join(', ')}
                        </TableCell>
                      </TableRow>
                    )}
                    {empresa.email && (
                      <TableRow>
                        <TableCell><Label>Email:</Label></TableCell>
                        <TableCell>{empresa.email}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </EmpresaCard>
        ))}
      </EmpresasGrid>
      {currentEmpresa && (
        <EditModal isOpen={isEditModalOpen} onClose={handleCloseModal} title={`Editar Empresa: ${currentEmpresa.nombre}`}>
          <EditEmpresaForm empresa={currentEmpresa} onClose={handleCloseModal} />
        </EditModal>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const EmpresasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  gap: 2rem;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
  }
`;

const EmpresaCard = styled.div`
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




