-- 0055: proc_diagramas.area_id (FK proc_areas, nullable) — vincula o diagrama à área do processo
--> statement-breakpoint
ALTER TABLE proc_diagramas ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES proc_areas(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_proc_diagramas_area_id ON proc_diagramas (area_id);