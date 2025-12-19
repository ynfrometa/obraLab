import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import AutofitGrid from 'components/AutofitGrid';
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
      <SectionTitle>Lista de Obras ({obras.length})</SectionTitle>
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
      <AutofitGrid>
        {obras.map((obra) => (
          <ObraCard key={obra.id}>
            <CardHeader>
              <ObraTitle>
                {Array.isArray(obra.empresa) 
                  ? obra.empresa.length > 0 
                    ? obra.empresa.join(', ') 
                    : 'Sin empresas'
                  : obra.empresa || 'Sin empresas'}
              </ObraTitle>
              <ButtonGroup>
                <EditButton onClick={() => handleEdit(obra)}>✏️</EditButton>
                <DeleteButton onClick={() => handleDelete(obra.id)}>×</DeleteButton>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              <InfoRow>
                <Label>Constructora:</Label>
                <Value>{obra.constructora}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Estado:</Label>
                <Value>{obra.estado}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Descripción:</Label>
                <Value>{obra.descripcion}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Encargado:</Label>
                <Value>{obra.encargado} ({obra.encargadoTel})</Value>
              </InfoRow>
              <InfoRow>
                <Label>Jefe de obra:</Label>
                <Value>{obra.jefeObra} ({obra.jefeObraTel})</Value>
              </InfoRow>
              <InfoRow>
                <Label>Dirección:</Label>
                <Value>{obra.direccion}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Poblado:</Label>
                <Value>{obra.poblado}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Fecha Inicio:</Label>
                <Value>{obra.fechaInicio ? new Date(obra.fechaInicio).toLocaleDateString('es-ES') : 'N/A'}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Solicitud:</Label>
                <Value>{obra.solicitud}</Value>
              </InfoRow>
            </CardContent>
          </ObraCard>
        ))}
      </AutofitGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const ObraCard = styled.div`
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

const ObraTitle = styled.h3`
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  color: rgb(var(--primary));
  flex: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
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
  flex-shrink: 0;

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
  flex-shrink: 0;

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

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgb(var(--text));
  opacity: 0.6;
  font-size: 1.8rem;
`;

