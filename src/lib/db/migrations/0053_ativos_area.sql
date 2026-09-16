-- 0053: ativos_categorias.area_id e ativos_tipos_vistoria.area_id (FK proc_areas) substituem o campo setor
--> statement-breakpoint
ALTER TABLE ativos_categorias ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES proc_areas(id) ON DELETE NO ACTION;
--> statement-breakpoint
ALTER TABLE ativos_tipos_vistoria ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES proc_areas(id) ON DELETE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_categorias_area_id ON ativos_categorias (area_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_tipos_vistoria_area_id ON ativos_tipos_vistoria (area_id);