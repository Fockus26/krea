CREATE TABLE "borradores_grupales" (
	"entrega_id" text PRIMARY KEY NOT NULL,
	"tarea_id" text NOT NULL,
	"equipo_id" text NOT NULL,
	"respuestas" jsonb NOT NULL,
	"actualizado_por" text NOT NULL,
	"actualizado_en" bigint NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "borradores_grupales_tarea_idx" ON "borradores_grupales" USING btree ("tarea_id");--> statement-breakpoint
CREATE INDEX "borradores_grupales_equipo_idx" ON "borradores_grupales" USING btree ("equipo_id");