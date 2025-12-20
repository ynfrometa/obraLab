import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditObraForm from './EditObraForm';

interface Obra {
  id: string;
  empresa: string | string[];
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
  fechaCreacion: number;
}

export default function ObrasListSection() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  useEffect(() => {
    // Verificar que database esté inicializado
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    // Referencia a la colección de Firestore (colección: obras)
    const db: Firestore = database;
    const obrasCollection = collection(db, 'obras');
    const obrasQuery = query(obrasCollection, orderBy('fechaCreacion', 'desc'));
    console.log('Iniciando escucha en colección: obras');

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(obrasQuery, (snapshot) => {
      console.log('=== DATOS DE FIRESTORE ===');
      console.log('Colección consultada: obras');
      console.log('Número de documentos:', snapshot.size);
      
      try {
        const obrasArray: Obra[] = snapshot.docs.map((docSnapshot) => {
          const obraData = docSnapshot.data();
          console.log(`Procesando obra ${docSnapshot.id}:`, obraData);
          
          return {
            id: docSnapshot.id,
            empresa: Array.isArray(obraData?.empresa) ? obraData.empresa : (obraData?.empresa ? [obraData.empresa] : []),
            descripcion: obraData?.descripcion || '',
            constructora: obraData?.constructora || '',
            encargado: obraData?.encargado || '',
            encargadoTel: obraData?.encargadoTel || '',
            jefeObra: obraData?.jefeObra || '',
            jefeObraTel: obraData?.jefeObraTel || '',
            direccion: obraData?.direccion || '',
            poblado: obraData?.poblado || '',
            estado: obraData?.estado || '',
            fechaInicio: obraData?.fechaInicio || '',
            solicitud: obraData?.solicitud || '',
            fechaCreacion: obraData?.fechaCreacion || Date.now(),
          };
        });
        
        console.log('Obras procesadas:', obrasArray);
        console.log('Total de obras a mostrar:', obrasArray.length);
        setObras(obrasArray);
      } catch (error) {
        console.error('Error al procesar obras:', error);
        setObras([]);
      }
      setLoading(false);
    }, (error: any) => {
      console.error('=== ERROR AL CARGAR OBRAS ===');
      console.error('Error completo:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje:', error?.message);
      
      if (error?.code === 'permission-denied') {
        console.error('⚠️ ERROR DE PERMISOS: Necesitas configurar las reglas de Firestore');
        console.error('Ve a Firebase Console → Firestore Database → Rules');
        console.error('Y configura: allow read, write: if true;');
      }
      
      setLoading(false);
      setObras([]);
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
    if (!confirm('¿Estás seguro de que quieres eliminar esta obra?')) {
      return;
    }
    try {
      const obraDoc = doc(database, 'obras', id);
      await deleteDoc(obraDoc);
      console.log('Obra eliminada:', id);
    } catch (error) {
      console.error('Error al eliminar obra:', error);
      alert('Error al eliminar la obra. Por favor, intenta de nuevo.');
    }
  };

  const handleEdit = (obra: Obra) => {
    setEditingObra(obra);
  };

  const handleCloseEdit = () => {
    setEditingObra(null);
  };

  const handleUpdate = async (updatedData: Partial<Obra>) => {
    if (!database || !editingObra) return;
    
    try {
      const obraDoc = doc(database, 'obras', editingObra.id);
      await updateDoc(obraDoc, updatedData);
      console.log('Obra actualizada:', editingObra.id);
      setEditingObra(null);
    } catch (error) {
      console.error('Error al actualizar obra:', error);
      alert('Error al actualizar la obra. Por favor, intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Obras</SectionTitle>
        <EmptyState>Cargando obras...</EmptyState>
      </Wrapper>
    );
  }

  if (obras.length === 0) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Obras</SectionTitle>
        <EmptyState>No hay obras registradas. Añade una usando el formulario de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionTitle>Lista de Obras</SectionTitle>
      <EditModal
        isOpen={!!editingObra}
        onClose={handleCloseEdit}
        title="Editar Obra"
      >
        {editingObra && (
          <EditObraForm
            obra={editingObra}
            onSave={handleUpdate}
            onCancel={handleCloseEdit}
          />
        )}
      </EditModal>
      <ObrasGrid>
        {obras.map((obra) => (
          <ObraCard key={obra.id}>
            <CardHeader>
              <HeaderContent>
                <HeaderLeft>
                  <HeaderTitle>OBRA</HeaderTitle>
                  <ProjectInfo>
                    <ProjectRow>
                      <ProjectLabel>Empresas:</ProjectLabel>
                      <ProjectValue>
                        {Array.isArray(obra.empresa) 
                          ? obra.empresa.length > 0 
                            ? obra.empresa.join(', ') 
                            : 'Sin empresas'
                          : obra.empresa || 'Sin empresas'}
                      </ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Constructora:</ProjectLabel>
                      <ProjectValue>{obra.constructora}</ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Estado:</ProjectLabel>
                      <ProjectValue>{obra.estado}</ProjectValue>
                    </ProjectRow>
                  </ProjectInfo>
                </HeaderLeft>
                <ButtonGroup>
                  <EditButton onClick={() => handleEdit(obra)}>✏️</EditButton>
                  <DeleteButton onClick={() => handleDelete(obra.id)}>×</DeleteButton>
                </ButtonGroup>
              </HeaderContent>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell><Label>Descripción:</Label></TableCell>
                      <TableCell>{obra.descripcion}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Encargado:</Label></TableCell>
                      <TableCell>{obra.encargado} ({obra.encargadoTel})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Jefe de obra:</Label></TableCell>
                      <TableCell>{obra.jefeObra} ({obra.jefeObraTel})</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Dirección:</Label></TableCell>
                      <TableCell>{obra.direccion}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Poblado:</Label></TableCell>
                      <TableCell>{obra.poblado}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Fecha Inicio:</Label></TableCell>
                      <TableCell>{obra.fechaInicio ? new Date(obra.fechaInicio).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Solicitud:</Label></TableCell>
                      <TableCell>{obra.solicitud}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </ObraCard>
        ))}
      </ObrasGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const ObrasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  gap: 2rem;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
  }
`;

const ObraCard = styled.div`
  padding: 2rem;
  background: rgb(var(--cardBackground));
  box-shadow: var(--shadow-md);
  border-radius: 0.6rem;
  color: rgb(var(--text));
  font-size: 1.6rem;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(var(--text), 0.1);

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
`;

const ProjectLabel = styled.span`
  font-weight: 600;
  font-size: 1.5rem;
  color: rgb(var(--text));
  min-width: 12rem;
  letter-spacing: 0.01em;
`;

const ProjectValue = styled.span`
  font-size: 1.5rem;
  font-weight: 500;
  color: rgb(var(--text));
  line-height: 1.6;
  letter-spacing: 0.01em;
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
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 2px solid rgba(var(--text), 0.2);
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

  &:first-child {
    font-weight: 600;
    min-width: 15rem;
    background: rgba(var(--primary), 0.05);
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

