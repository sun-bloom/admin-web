import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import type { Product } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductsTableProps {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function ProductsTable({ products, onDelete, onEdit }: ProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 hover:bg-muted"
            >
              <span className="font-semibold text-foreground">Product</span>
              <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={
                  row.original.images[0] ||
                  row.original.variants.find((v) => v.isAvailable)?.images?.[0] ||
                  row.original.variants[0]?.images?.[0]
                }
                alt={row.original.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {row.original.name}
              </p>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {row.original.description}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: () => (
          <span className="font-semibold text-foreground">Category</span>
        ),
        cell: ({ row }) => {
          const categoryName = (
            typeof row.original.category === 'string'
              ? row.original.category
              : row.original.category?.name || ''
          ).replace(/_/g, ' ');
          const subcategoryName = (
            typeof row.original.subcategory === 'string'
              ? row.original.subcategory
              : row.original.subcategory?.name || ''
          ).replace(/_/g, ' ');

          return (
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="w-fit">
                {categoryName}
              </Badge>
              {subcategoryName && (
                <span className="text-xs text-muted-foreground">
                  {subcategoryName}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'basePrice',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 hover:bg-muted"
          >
            <span className="font-semibold text-foreground">Price</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const activeVariants = row.original.variants.filter((v) => v.isAvailable !== false);
          const variantsForPrice = activeVariants.length ? activeVariants : row.original.variants;
          if (!variantsForPrice.length) return <span className="text-muted-foreground text-sm">—</span>;
          const minPrice = Math.min(
            ...variantsForPrice.map((v) => row.original.basePrice + v.additionalPrice)
          );
          const maxPrice = Math.max(
            ...variantsForPrice.map((v) => row.original.basePrice + v.additionalPrice)
          );
          return (
            <span className="font-medium text-foreground">
              {minPrice === maxPrice
                ? formatCurrency(minPrice)
                : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'stock',
        header: () => (
          <span className="font-semibold text-foreground">Stock</span>
        ),
        cell: ({ row }) => {
          const totalStock = row.original.variants
            .filter((v) => v.isAvailable !== false)
            .reduce((sum, v) => sum + v.stock, 0);
          const isLowStock = totalStock < 5;
          return (
            <div className="flex items-center gap-2">
              <Package
                className={cn('h-4 w-4', isLowStock ? 'text-destructive' : 'text-success')}
              />
              <span
                className={cn(
                  'font-medium text-foreground',
                  isLowStock && 'text-destructive'
                )}
              >
                {totalStock} units
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: () => (
          <span className="font-semibold text-foreground">Status</span>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={`/products/${row.original.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(row.original.id)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(row.original.id)}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDelete, onEdit]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-12 px-6 text-left align-middle font-medium border-b"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-4 px-6 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                      <p>No products found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {table.getFilteredRowModel().rows.length}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">{products.length}</span>{' '}
          products
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
