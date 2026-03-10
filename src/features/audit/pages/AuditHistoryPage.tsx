import React, { useCallback } from 'react';
import { Filter, Clock, ChevronLeft, ChevronRight, Loader2, Globe, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useAuditHistory } from '../hooks/useAuditHistory';
import type { AuditLogAction } from '../types';
import { GlobalSearch } from '../../../components/GlobalSearch';


// Utility: format entity_id date from folio or created_at
const formatDateShort = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Utility for relative time / date formatting
const formatTimeOrDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
  if (diffInMinutes < 2880) return `Hace 1 día`;
  if (diffInMinutes < 10080) return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Build a human-readable target string — never show raw UUIDs
const buildTarget = (item: AuditLogAction): string => {
  const d = item.json_details;
  const dateStr = formatDateShort(item.created_at);

  // For WORK entities, show folio + date
  if (item.entity === 'WORK') {
    if (d?.folio) return `Folio #${d.folio} el ${dateStr}`;
    return `Trabajo el ${dateStr}`;
  }

  // For USER entities, show name/email
  if (item.entity === 'USER') {
    if (d?.name) return d.name;
    if (d?.email) return d.email;
    return '';
  }

  // Fallback: use details or nothing (never raw UUID)
  if (d?.name) return d.name;
  if (d?.folio) return `Folio #${d.folio}`;
  return '';
};

export default function AuditHistoryPage() {
  const { 
    timelineData, metricsData, isLoading, error, 
    page, setPage, activeTab, setActiveTab, totalPages
  } = useAuditHistory(10);

  const handleSearch = useCallback((_term: string) => {
    // Future: pass search term to backend filters
  }, []);

  // Group timeline data by Date
  const groupedTimeline = React.useMemo(() => {
    if (!timelineData?.data) return [];
    
    const groups: { [key: string]: AuditLogAction[] } = {};
    timelineData.data.forEach(item => {
      const dateKey = new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([dateGroup, items]) => ({
      dateGroup: `${dateGroup} (${items.length})`,
      items: items.map(item => {
        let targetStr = buildTarget(item);
        let displayAction = item.action.toLowerCase().replace(/_/g, ' ');
        let colorType = item.action;
        const dateStr = formatDateShort(item.created_at);

        if (item.action === 'STATUS_CHANGE' && item.json_details?.new_status) {
            const newStatus = item.json_details.new_status;
            colorType = newStatus;
            const folio = item.json_details?.folio ? `Folio #${item.json_details.folio}` : 'trabajo';
            
            switch(newStatus) {
                case 'APPROVED': displayAction = `aprobó ${folio}`; break;
                case 'REJECTED': displayAction = `rechazó ${folio}`; break;
                case 'READY_FOR_REVIEW': displayAction = `envió a revisión ${folio}`; break;
                case 'IN_PROGRESS': displayAction = `marcó en proceso ${folio}`; break;
                case 'PENDING': displayAction = `marcó como pendiente ${folio}`; break;
                default: displayAction = `cambió el estado a ${newStatus.toLowerCase().replace(/_/g, ' ')}`;
            }
            targetStr = dateStr ? `el ${dateStr}` : '';
        } else if (item.action === 'CREATE') {
            if (item.entity === 'WORK') {
                const folio = item.json_details?.folio ? `con Folio #${item.json_details.folio}` : '';
                displayAction = `agregó trabajo ${folio} el ${dateStr}`;
                targetStr = '';
            } else {
                displayAction = 'agregó proyectista';
            }
        } else if (item.action === 'UPDATE') {
            if (item.entity === 'WORK') {
                const folio = item.json_details?.new_folio ? `Folio #${item.json_details.new_folio}` : (item.json_details?.folio ? `Folio #${item.json_details.folio}` : 'trabajo');
                displayAction = `modificó ${folio}`;
                targetStr = dateStr ? `el ${dateStr}` : '';
            } else {
                displayAction = 'editó información de';
                targetStr = item.json_details?.name || '';
            }
        } else if (item.action === 'DELETE') {
            displayAction = item.entity === 'USER' ? 'eliminó proyectista' : 'eliminó';
        } else if (item.action === 'COMMENT') {
            const folio = item.json_details?.folio ? `Folio #${item.json_details.folio}` : 'escritura';
            displayAction = `comentó en ${folio}`;
            targetStr = dateStr ? `el ${dateStr}` : '';
        } else if (item.action === 'LOGIN') {
            displayAction = 'inició sesión';
            targetStr = '';
        } else if (item.action === 'ASSIGN') {
            const folio = item.json_details?.folio ? `Folio #${item.json_details.folio}` : 'un trabajo';
            displayAction = `asignó ${folio} a ${item.json_details?.assigned_to || 'un proyectista'}`;
            targetStr = '';
        } else if (item.action === 'UNASSIGN') {
            displayAction = `removió de colaborador a ${item.json_details?.removed_user || 'un proyectista'}`;
            targetStr = '';
        } else if (item.action === 'ADD_ACT') {
            displayAction = `asoció acto "${item.json_details?.act_name || ''}" al trabajo`;
            targetStr = item.json_details?.folio ? `Folio #${item.json_details.folio}` : '';
        } else if (item.action === 'REMOVE_ACT') {
            displayAction = `removió acto "${item.json_details?.act_name || ''}" del trabajo`;
            targetStr = item.json_details?.folio ? `Folio #${item.json_details.folio}` : '';
        } else if (item.action === 'ADD_REQUIREMENT') {
            displayAction = `agregó requisito "${item.json_details?.requirement_name || ''}" al trabajo`;
            targetStr = item.json_details?.folio ? `Folio #${item.json_details.folio}` : '';
        } else if (item.action === 'DELETE_REQUIREMENT') {
            displayAction = `eliminó requisito "${item.json_details?.requirement_name || ''}" del trabajo`;
            targetStr = item.json_details?.folio ? `Folio #${item.json_details.folio}` : '';
        }

        return {
          id: item.id,
          type: colorType,
          user: item.user_name || 'Sistema',
          action: displayAction,
          target: targetStr,
          time: formatTimeOrDate(item.created_at)
        };
      })
    }));
  }, [timelineData]);

  // Colors mapping logic for User Actions
  const getUserActionColorDetails = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('AGREGA')) return { tailwind: 'bg-[#10B981]', hex: '#10B981', label: 'Agregado' };
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('ELIMINA')) return { tailwind: 'bg-[#dc2626]', hex: '#dc2626', label: 'Eliminado' };
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('INICIO')) return { tailwind: 'bg-[#8b5cf6]', hex: '#8b5cf6', label: 'Inicio de sesión' };
    
    // Everything else (UPDATE, MODIFY, STATUS_CHANGE) goes to Modificado
    return { tailwind: 'bg-[#f59e0b]', hex: '#f59e0b', label: 'Modificado' };
  };

  // Colors mapping logic for Work Actions
  const getWorkActionColorDetails = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('AGREGA')) return { tailwind: 'bg-[#10B981]', hex: '#10B981', label: 'Agregado' };
    if (act.includes('APPROVE') || act.includes('APROBA') || act.includes('APPROV')) return { tailwind: 'bg-[#10B981]', hex: '#10B981', label: 'Aprobado' };
    if (act.includes('COMMENT') || act.includes('COMENTA')) return { tailwind: 'bg-[#f59e0b]', hex: '#f59e0b', label: 'Comentarios' };
    if (act.includes('REJECT') || act.includes('RECHAZA')) return { tailwind: 'bg-[#dc2626]', hex: '#dc2626', label: 'Rechazado' };
    if (act.includes('REVIEW') || act.includes('REVIS') || act.includes('ENVIA')) return { tailwind: 'bg-[#3b82f6]', hex: '#3b82f6', label: 'Enviado a revisión' };
    if (act.includes('UPDATE') || act.includes('MODIFY') || act.includes('EDITA') || act.includes('MODIFICA')) return { tailwind: 'bg-[#f59e0b]', hex: '#f59e0b', label: 'Modificado' };
    if (act.includes('ASSIGN') || act.includes('ASIGNA') || act.includes('UNASSIGN')) return { tailwind: 'bg-[#8b5cf6]', hex: '#8b5cf6', label: 'Asignado' };
    if (act.includes('ADD_ACT') || act.includes('REMOVE_ACT')) return { tailwind: 'bg-[#06b6d4]', hex: '#06b6d4', label: 'Actos' };
    if (act.includes('ADD_REQUIREMENT') || act.includes('DELETE_REQUIREMENT')) return { tailwind: 'bg-[#6366f1]', hex: '#6366f1', label: 'Requisitos' };
    
    return { tailwind: 'bg-gray-400', hex: '#9ca3af', label: 'Otros' };
  };

  const getDotColor = (type: string) => {
    return activeTab === 'trabajos' ? getWorkActionColorDetails(type).tailwind : getUserActionColorDetails(type).tailwind;
  };

  // Map Pie Chart Data (User Actions)
  const pieData = React.useMemo(() => {
    if (!metricsData?.user_actions) return [];
    
    const grouped = new Map();
    metricsData.user_actions.forEach(m => {
      const colorInfo = getUserActionColorDetails(m.action);
      if (grouped.has(colorInfo.label)) {
        grouped.get(colorInfo.label).value += m.count;
      } else {
        grouped.set(colorInfo.label, { name: colorInfo.label, value: m.count, color: colorInfo.hex, originalAction: m.action });
      }
    });
    return Array.from(grouped.values());
  }, [metricsData]);

  // Map Bar Chart Data (Work Actions)
  const barData = React.useMemo(() => {
    if (!metricsData?.work_actions) return [];

    const grouped = new Map();
    metricsData.work_actions.forEach(m => {
      const colorInfo = getWorkActionColorDetails(m.action);
      if (grouped.has(colorInfo.label)) {
        grouped.get(colorInfo.label).value += m.count;
      } else {
        grouped.set(colorInfo.label, { name: colorInfo.label, value: m.count, fill: colorInfo.hex });
      }
    });
    
    // Sort logic to match expected order
    const order = ['Agregado', 'Aprobado', 'Comentarios', 'Rechazado', 'Enviado a revisión', 'Modificado', 'Asignado', 'Otros'];
    return Array.from(grouped.values()).sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      // If a label isn't in 'order' map it to 'Otros' order index
      const finalIndexA = indexA === -1 ? order.length : indexA;
      const finalIndexB = indexB === -1 ? order.length : indexB;
      return finalIndexA - finalIndexB;
    });
  }, [metricsData]);

  const totalProyectistasActions = pieData.reduce((acc, curr) => acc + curr.value, 0);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* Header Area (Global Search matched style) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="flex-1 w-full max-w-[500px]">
          <GlobalSearch onSearch={handleSearch} />
        </div>
        <div className="flex-shrink-0 sm:ml-auto flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors focus:outline-none whitespace-nowrap h-10">
            <Globe className="w-4 h-4" />
            <span>Vista global</span>
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>
      </div>

      {/* Title & Divider */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-600 shrink-0">Historial de auditoría</h1>
      </div>

      {/* Controls (Tabs & Filtrar) */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'usuarios' 
                ? 'bg-[#3d3d3d] text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Acciones de usuarios
          </button>
          <button 
            onClick={() => setActiveTab('trabajos')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              activeTab === 'trabajos' 
                ? 'bg-[#3d3d3d] text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Acciones de trabajos
          </button>
        </div>
        
        <div className="relative">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filtrar
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#740A03]" />
                </div>
              ) : groupedTimeline.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                  No hay registros de auditoría disponibles.
                </div>
              ) : groupedTimeline.map((group, groupIdx) => (
                <div key={groupIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-[15px] font-bold text-gray-600">{group.dateGroup}</h3>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-6 relative">
                      {group.items.map((item, itemIdx) => {
                        const isLastInGroup = itemIdx === group.items.length - 1;
                        return (
                          <li key={item.id} className="relative flex gap-4">
                            {/* Vertical connecting line */}
                            {!isLastInGroup && (
                              <div className="absolute top-5 bottom-[-24px] left-[7px] w-px bg-gray-200" />
                            )}
                            
                            {/* Dot */}
                            <div className="relative z-10 shrink-0 flex items-start pt-[6px]">
                              <div className={`w-3.5 h-3.5 rounded-full ${getDotColor(item.type)}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                              <p className="text-sm text-gray-700 leading-snug">
                                <span className="font-semibold text-gray-900">{item.user}</span>{' '}
                                {item.action}{' '}
                                {item.target && <span className="font-semibold text-gray-900">{item.target}</span>}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium text-gray-500">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>{item.time}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-1.5 pt-4 pb-12">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 border border-gray-200 bg-white rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Simple pagination generation */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1; // Simplified 1-5 navigation
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      page === pageNum 
                        ? 'bg-[#740A03] text-white shadow-sm' 
                        : 'bg-transparent text-gray-600 hover:bg-black/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <div className="px-1 text-gray-400">...</div>
                  <button 
                    onClick={() => setPage(totalPages)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      page === totalPages ? 'bg-[#740A03] text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-black/5'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || isLoading}
                className="p-2 border border-gray-200 bg-white rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column - Charts (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-[15px] font-bold text-gray-600 mb-6">Acciones de Proyectistas</h3>
              <div className="flex flex-col items-center justify-center w-full">
                
                <div className="relative w-48 h-48 min-h-[192px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ color: '#374151', fontSize: '14px', fontWeight: 500 }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{totalProyectistasActions}</span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="w-full flex justify-center">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-[15px] font-bold text-gray-600 mb-6">Acciones de trabajos</h3>
              <div className="w-full min-h-[280px] h-[280px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 0, right: 35, left: -20, bottom: 0 }}
                    barSize={18}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#4B5563', fontSize: 13, fontWeight: 500 }} 
                      width={110} 
                    />
                    <Tooltip 
                      cursor={{fill: '#F3F4F6', opacity: 0.5}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                    >
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="right" 
                        fill="#6B7280" 
                        fontSize={13} 
                        fontWeight={500} 
                        offset={10} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
    </div>
  );
}
