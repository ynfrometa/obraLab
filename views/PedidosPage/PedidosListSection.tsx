import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import SectionTitle from 'components/SectionTitle';
import { media } from 'utils/media';
import { database } from 'lib/firebase';
import type { Firestore } from 'firebase/firestore';
import EditModal from 'components/EditModal';
import EditPedidoForm from './EditPedidoForm';

interface Pedido {
  id: string;
  fecha: string;
  descripcion: string;
  cantidad: string;
  costo: string;
  constructora: string;
  obra: string;
  empresa: string;
  proveedor: string;
  trabajador: string;
  fechaCreacion: number;
}

interface PedidosListSectionProps {
  onShowForm?: () => void;
}

export default function PedidosListSection({ onShowForm }: PedidosListSectionProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (!database) {
      console.error('Firebase database no está inicializado');
      setLoading(false);
      return;
    }

    const db: Firestore = database;
    const pedidosCollection = collection(db, 'pedidos');
    const pedidosQuery = query(pedidosCollection, orderBy('fechaCreacion', 'desc'));

    const unsubscribe = onSnapshot(pedidosQuery, (snapshot) => {
      try {
        const pedidosArray: Pedido[] = snapshot.docs.map((docSnapshot) => {
          const pedidoData = docSnapshot.data();
          return {
            id: docSnapshot.id,
            fecha: pedidoData?.fecha || '',
            descripcion: pedidoData?.descripcion || '',
            cantidad: pedidoData?.cantidad || '',
            costo: pedidoData?.costo || '',
            constructora: pedidoData?.constructora || '',
            obra: pedidoData?.obra || '',
            empresa: pedidoData?.empresa || '',
            proveedor: pedidoData?.proveedor || '',
            trabajador: pedidoData?.trabajador || '',
            fechaCreacion: pedidoData?.fechaCreacion || Date.now(),
          };
        });
        setPedidos(pedidosArray);
      } catch (error) {
        console.error('Error al procesar pedidos:', error);
        setPedidos([]);
      }
      setLoading(false);
    }, (error: any) => {
      console.error('Error al cargar pedidos:', error);
      setLoading(false);
      setPedidos([]);
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
    if (!confirm('¿Estás seguro de que quieres eliminar esta hoja de pedidos?')) {
      return;
    }
    try {
      const pedidoDoc = doc(database, 'pedidos', id);
      await deleteDoc(pedidoDoc);
      console.log('Pedido eliminado:', id);
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      alert('Error al eliminar la hoja de pedidos. Por favor, intenta de nuevo.');
    }
  };

  const handleEdit = (pedido: Pedido) => {
    setEditingPedido(pedido);
  };

  const handleCloseEdit = () => {
    setEditingPedido(null);
  };

  const handleUpdate = async (updatedData: Partial<Pedido>) => {
    if (!database || !editingPedido) return;
    
    try {
      const pedidoDoc = doc(database, 'pedidos', editingPedido.id);
      await updateDoc(pedidoDoc, updatedData);
      console.log('Pedido actualizado:', editingPedido.id);
      setEditingPedido(null);
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      alert('Error al actualizar la hoja de pedidos. Por favor, intenta de nuevo.');
    }
  };

  // Funciones de exportación con importación dinámica para evitar problemas con SSR
  const handleExportExcel = async (pedido: Pedido) => {
    try {
      const { exportToExcel } = await import('utils/exportPedido');
      exportToExcel(pedido);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel. Por favor, intenta de nuevo.');
    }
  };

  const handleExportPDF = async (pedido: Pedido) => {
    try {
      const { exportToPDF } = await import('utils/exportPedido');
      exportToPDF(pedido);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Error al exportar a PDF. Por favor, intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <HeaderRow>
          <SectionTitle>Lista de Hojas de Pedidos</SectionTitle>
          {onShowForm && (
            <AddButton onClick={onShowForm}>
              + Añadir Nueva Hoja de Pedidos
            </AddButton>
          )}
        </HeaderRow>
        <EmptyState>Cargando pedidos...</EmptyState>
      </Wrapper>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Wrapper>
        <HeaderRow>
          <SectionTitle>Lista de Hojas de Pedidos</SectionTitle>
          {onShowForm && (
            <AddButton onClick={onShowForm}>
              + Añadir Nueva Hoja de Pedidos
            </AddButton>
          )}
        </HeaderRow>
        <EmptyState>No hay hojas de pedidos registradas. Añade una usando el botón de arriba.</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderRow>
        <SectionTitle>Lista de Hojas de Pedidos</SectionTitle>
        {onShowForm && (
          <AddButton onClick={onShowForm}>
            + Añadir Nueva Hoja de Pedidos
          </AddButton>
        )}
      </HeaderRow>
      <EditModal
        isOpen={!!editingPedido}
        onClose={handleCloseEdit}
        title="Editar Hoja de Pedidos"
      >
        {editingPedido && (
          <EditPedidoForm
            pedido={editingPedido}
            onSave={handleUpdate}
            onCancel={handleCloseEdit}
          />
        )}
      </EditModal>
      <PedidosGrid>
        {pedidos.map((pedido) => (
          <PedidoCard key={pedido.id}>
            <CardHeader>
              <HeaderContent>
                <HeaderLeft>
                  <HeaderTitle>HOJA DE PEDIDOS</HeaderTitle>
                  <ProjectInfo>
                    <ProjectRow>
                      <ProjectLabel>Fecha:</ProjectLabel>
                      <ProjectValue>
                        {pedido.fecha ? new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-ES') : 'N/A'}
                      </ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Descripción:</ProjectLabel>
                      <ProjectValue>{pedido.descripcion}</ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Cantidad:</ProjectLabel>
                      <ProjectValue>{pedido.cantidad}</ProjectValue>
                    </ProjectRow>
                    <ProjectRow>
                      <ProjectLabel>Costo:</ProjectLabel>
                      <ProjectValue>{pedido.costo ? `${pedido.costo} €` : 'N/A'}</ProjectValue>
                    </ProjectRow>
                  </ProjectInfo>
                  <ExportButtonsGroup>
                    <ExportButton onClick={() => handleExportExcel(pedido)} title="Exportar a Excel">
                      📊 Excel
                    </ExportButton>
                    <ExportButton onClick={() => handleExportPDF(pedido)} title="Exportar a PDF">
                      📄 PDF
                    </ExportButton>
                  </ExportButtonsGroup>
                </HeaderLeft>
                <ButtonGroup>
                  <EditButton onClick={() => handleEdit(pedido)}>✏️</EditButton>
                  <DeleteButton onClick={() => handleDelete(pedido.id)}>×</DeleteButton>
                </ButtonGroup>
              </HeaderContent>
            </CardHeader>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell><Label>Constructora:</Label></TableCell>
                      <TableCell>{pedido.constructora}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Obra:</Label></TableCell>
                      <TableCell>{pedido.obra}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Empresa:</Label></TableCell>
                      <TableCell>{pedido.empresa}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Proveedor:</Label></TableCell>
                      <TableCell>{pedido.proveedor}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Trabajador:</Label></TableCell>
                      <TableCell>{pedido.trabajador}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Label>Costo:</Label></TableCell>
                      <TableCell>{pedido.costo ? `${pedido.costo} €` : 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </PedidoCard>
        ))}
      </PedidosGrid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const PedidosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  gap: 2rem;

  ${media('<=tablet')} {
    grid-template-columns: 1fr;
  }
`;

const PedidoCard = styled.div`
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

const ExportButtonsGroup = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  justify-content: flex-start;

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
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.2s, background 0.2s;

  &:hover {
    transform: scale(1.05);
    background: rgba(var(--primary), 0.9);
  }

  ${media('<=phone')} {
    width: 100%;
    font-size: 1.2rem;
    padding: 0.7rem 1.2rem;
  }
`;



