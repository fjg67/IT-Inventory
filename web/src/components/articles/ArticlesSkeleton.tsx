import { DataTableSkeleton } from '../data/DataTableSkeleton';

const headers = ['Article', 'Référence', 'Famille', 'Quantité', 'Seuil', 'Emplacement', 'Statut'];
export function ArticlesSkeleton() {
  return <DataTableSkeleton label="Chargement des articles" headers={headers} numericColumns={[3, 4]} />;
}
