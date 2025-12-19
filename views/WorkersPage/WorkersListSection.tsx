import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import BasicCard from 'components/BasicCard';
import AutofitGrid from 'components/AutofitGrid';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditWorkerForm from './EditWorkerForm';

interface Worker {
  id: string;
  name: string;
  alias: string;
  address: string;
  phoneNumber: string;
  job: string;
  company: string;
  workStatus: string;
  hireDate: number; // Timestamp en milisegundos
}

export default function WorkersListSection() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Verificar que database esté inicializado
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    // Referencia a la colección de Firestore (colección: workers)
    const db: Firestore = database;
    const workersCollection = collection(db, 'workers');
    const workersQuery = query(workersCollection, orderBy('hireDate', 'desc'));
    console.log('Iniciando escucha en colección: workers');

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(workersQuery, (snapshot) => {
      console.log('=== DATOS DE FIRESTORE ===');
      console.log('Colección consultada: workers');
      console.log('Número de documentos:', snapshot.size);
      
      try {
        const workersArray: Worker[] = snapshot.docs.map((docSnapshot) => {
          const workerData = docSnapshot.data();
          console.log(`Procesando trabajador ${docSnapshot.id}:`, workerData);
          
          return {
            id: docSnapshot.id,
            name: workerData?.name || workerData?.nombre || '',
            alias: workerData?.alias || '',
            address: workerData?.address || workerData?.direccion || '',
            phoneNumber: workerData?.phoneNumber || workerData?.telefono || '',
            job: workerData?.job || workerData?.puesto || '',
            company: workerData?.company || workerData?.empresa || '',
            workStatus: workerData?.workStatus || workerData?.estado || '',
            hireDate: workerData?.hireDate || workerData?.fechaIngreso || Date.now(),
          };
        });
        
        console.log('Trabajadores procesados:', workersArray);
        console.log('Total de trabajadores a mostrar:', workersArray.length);
        setWorkers(workersArray);
      } catch (error) {
        console.error('Error al procesar trabajadores:', error);
        setWorkers([]);
      }
      setLoading(false);
    }, (error: any) => {
      console.error('=== ERROR AL CARGAR TRABAJADORES ===');
      console.error('Error completo:', error);
      console.error('Código de error:', error?.code);
      console.error('Mensaje:', error?.message);
      
      if (error?.code === 'permission-denied') {
        console.error('⚠️ ERROR DE PERMISOS: Necesitas configurar las reglas de Firestore');
        console.error('Ve a Firebase Console → Firestore Database → Rules');
        console.error('Y configura: allow read, write: if true;');
      }
      
      setLoading(false);
      setWorkers([]);
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
    if (!confirm('¿Estás seguro de que quieres eliminar este trabajador?')) {
      return;
    }
    try {
      const workerDoc = doc(database, 'workers', id);
      await deleteDoc(workerDoc);
      console.log('Trabajador eliminado:', id);
    } catch (error) {
      console.error('Error al eliminar trabajador:', error);
      alert('Error al eliminar el trabajador. Por favor, intenta de nuevo.');
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
  };

  const handleCloseEdit = () => {
    setEditingWorker(null);
  };

  const handleUpdate = async (updatedData: Partial<Worker>) => {
    if (!database || !editingWorker) return;
    
    try {
      const workerDoc = doc(database, 'workers', editingWorker.id);
      await updateDoc(workerDoc, updatedData);
      console.log('Trabajador actualizado:', editingWorker.id);
      setEditingWorker(null);
    } catch (error) {
      console.error('Error al actualizar trabajador:', error);
      alert('Error al actualizar el trabajador. Por favor, intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Trabajadores</SectionTitle>
        <EmptyState>Cargando trabajadores...</EmptyState>
      </Wrapper>
    );
  }

  if (workers.length === 0) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Trabajadores</SectionTitle>
        <EmptyState>No hay trabajadores registrados. Añade uno usando el formulario de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionTitle>Lista de Trabajadores ({workers.length})</SectionTitle>
      <EditModal
        isOpen={!!editingWorker}
        onClose={handleCloseEdit}
        title="Editar Trabajador"
      >
        {editingWorker && (
          <EditWorkerForm
            worker={editingWorker}
            onSave={handleUpdate}
            onCancel={handleCloseEdit}
          />
        )}
      </EditModal>
      <AutofitGrid>
        {workers.map((worker) => (
          <WorkerCard key={worker.id}>
            <CardHeader>
              <WorkerName>{worker.name} ({worker.alias})</WorkerName>
              <ButtonGroup>
                <EditButton onClick={() => handleEdit(worker)}>✏️</EditButton>
                <DeleteButton onClick={() => handleDelete(worker.id)}>×</DeleteButton>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              <InfoRow>
                <Label>Puesto:</Label>
                <Value>{worker.job}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Empresa:</Label>
                <Value>{worker.company}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Dirección:</Label>
                <Value>{worker.address}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Teléfono:</Label>
                <Value>{worker.phoneNumber}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Estado:</Label>
                <Value>{worker.workStatus}</Value>
              </InfoRow>
              <InfoRow>
                <Label>Fecha de contratación:</Label>
                <Value>{new Date(worker.hireDate).toLocaleDateString('es-ES')}</Value>
              </InfoRow>
            </CardContent>
          </WorkerCard>
        ))}
      </AutofitGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const WorkerCard = styled.div`
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

const WorkerName = styled.h3`
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

