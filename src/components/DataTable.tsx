'use client';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
  loading,
  emptyMessage = 'لا توجد بيانات',
  actions,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.label}
              </th>
            ))}
            {actions && <th className="w-32">الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr 
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render 
                    ? column.render(item) 
                    : String((item as Record<string, unknown>)[column.key] ?? '-')
                  }
                </td>
              ))}
              {actions && (
                <td onClick={(e) => e.stopPropagation()}>
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
