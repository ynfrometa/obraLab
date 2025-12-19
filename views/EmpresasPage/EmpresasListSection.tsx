import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import AutofitGrid from 'components/AutofitGrid';
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
  email?: string;
  fechaCreacion: number;
}

export default function EmpresasListSection() {
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
        <SectionTitle>Lista de Empresas</SectionTitle>
        <EmptyState>Cargando empresas...</EmptyState>
      </Wrapper>
    );
  }

  if (empresas.length === 0) {
    return (
      <Wrapper>
        <SectionTitle>Lista de Empresas</SectionTitle>
        <EmptyState>No hay empresas registradas. Añade una usando el formulario de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionTitle>Lista de Empresas ({empresas.length})</SectionTitle>
      <AutofitGrid>
        {empresas.map((empresa) => (
          <EmpresaCard key={empresa.id}>
            <CardHeader>
              <EmpresaName>{empresa.nombre}</EmpresaName>
              <ButtonGroup>
                <EditButton onClick={() => handleEdit(empresa)}>✏️</EditButton>
                <DeleteButton onClick={() => handleDelete(empresa.id)}>×</DeleteButton>
              </ButtonGroup>
            </CardHeader>
            <CardContent>
              {empresa.direccion && (
                <InfoRow>
                  <Label>Dirección:</Label>
                  <Value>{empresa.direccion}</Value>
                </InfoRow>
              )}
              {empresa.telefono && (
                <InfoRow>
                  <Label>Teléfono:</Label>
                  <Value>{empresa.telefono}</Value>
                </InfoRow>
              )}
              {empresa.email && (
                <InfoRow>
                  <Label>Email:</Label>
                  <Value>{empresa.email}</Value>
                </InfoRow>
              )}
            </CardContent>
          </EmpresaCard>
        ))}
      </AutofitGrid>
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

const EmpresaCard = styled.div`
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

const EmpresaName = styled.h3`
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




