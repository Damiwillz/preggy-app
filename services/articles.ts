import { supabase } from '@/lib/supabase';

export type Article = {
  id: string;
  slug: string;
  category: string;
  read_time: string;
  title: string;
  subtitle: string;
  image_key: string;
  route: string;
  featured: boolean;
  sort_order: number;
};

export async function getPublishedArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []) as Article[];
}
