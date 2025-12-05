"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Table2, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemHeader,
  ItemTitle,
  ItemDescription,
  ItemFooter,
} from "@/components/ui/item";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "../ui/skeleton";

export type TableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  className?: string;
};

export interface CardContentConfig {
  title: React.ReactNode;
  description?: React.ReactNode;
  media?: React.ReactNode;
  footer?: React.ReactNode;
  content?: React.ReactNode;
}

export type ListingFilterOption = {
  label: string;
  value: string;
};

export type ListingFilter = {
  id: string;
  label: string;
  options: ListingFilterOption[];
  placeholder?: string;
};

export type ListingFilterState = {
  search: string;
  filters: Record<string, string>;
};

export interface ListingViewProps<T> {
  title?: string;
  data: T[];
  isLoading?: boolean;
  error?: string;
  cardContent: (item: T) => CardContentConfig;
  columns: TableColumn<T>[];
  keyAccessor: (item: T, index: number) => string;
  emptyState?: React.ReactNode;
  actions?: React.ReactNode;
  defaultView?: "card" | "table";
  className?: string;
  headerContent?: React.ReactNode;
  filters?: ListingFilter[];
  onFilterChange?: (state: ListingFilterState) => void;
  searchPlaceholder?: string;
}

export function ListingView<T>({
  title,
  data,
  isLoading,
  error,
  cardContent,
  columns,
  keyAccessor,
  emptyState,
  actions,
  defaultView = "card",
  className,
  headerContent,
  filters,
  onFilterChange,
  searchPlaceholder = "Search…",
}: ListingViewProps<T>) {
  const [view, setView] = useState<"card" | "table">(defaultView);
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  const hasData = data && data.length > 0;

  useEffect(() => {
    onFilterChange?.({
      search: searchValue,
      filters: selectedFilters,
    });
  }, [onFilterChange, searchValue, selectedFilters]);

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={view === "card" ? "default" : "ghost"}
        size="icon"
        onClick={() => setView("card")}
        aria-label="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="icon"
        onClick={() => setView("table")}
        aria-label="Table view"
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderCardView = useMemo(() => {
    if (!hasData) return null;
    return (
      <ItemGroup>
        {data.map((item, index) => {
          const key = keyAccessor(item, index);
          const { title, description, media, footer, content } =
            cardContent(item);
          return (
            <Item key={key} variant="outline" className="p-4 gap-4">
              {media}
              <ItemContent>
                <ItemHeader>
                  <ItemTitle>{title}</ItemTitle>
                </ItemHeader>
                {description && (
                  <ItemDescription>{description}</ItemDescription>
                )}
                {content}
                {footer && <ItemFooter>{footer}</ItemFooter>}
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    );
  }, [cardContent, data, hasData, keyAccessor]);

  const renderTableView = useMemo(() => {
    if (!hasData) return null;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={keyAccessor(item, index)}>
              {columns.map((column) => (
                <TableCell
                  key={`${column.id}-${keyAccessor(item, index)}`}
                  className={column.className}
                >
                  {column.cell(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }, [columns, data, hasData, keyAccessor]);

  return (
    <Card className={cn("space-y-4", className)}>
      {(title || actions || headerContent) && (
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {headerContent}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              {viewToggle}
            </div>
            {(filters?.length || onFilterChange) && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="pl-9"
                  />
                </div>
                {filters?.map((filter) => (
                  <Select
                    key={filter.id}
                    value={selectedFilters[filter.id] || "all"}
                    onValueChange={(value) =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        [filter.id]: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue
                        placeholder={filter.placeholder || "All"}
                      ></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {filter.placeholder || "All"}
                      </SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {isLoading && (
          <DashboardSkeleton title="Loading items...">
            <div className="py-12 text-center text-muted-foreground">
              Loading items...
            </div>
          </DashboardSkeleton>
        )}
        {error && (
          <div className="py-12 text-center text-red-500">Error: {error}</div>
        )}
        {!isLoading && !error && !hasData && (
          <div className="py-12 text-center text-muted-foreground">
            {emptyState || "No records found."}
          </div>
        )}
        {!isLoading && !error && hasData && (
          <div className="space-y-4">
            {view === "card" ? renderCardView : renderTableView}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
