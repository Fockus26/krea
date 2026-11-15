CREATE TABLE "partes" (
	"entrega_id" text NOT NULL,
	"pregunta_id" text NOT NULL,
	"tarea_id" text NOT NULL,
	"equipo_id" text NOT NULL,
	"asignado" text NOT NULL,
	"estado" text NOT NULL,
	"respuesta" jsonb,
	"entregada_en" bigint,
	"actualizado_en" bigint NOT NULL,
	CONSTRAINT "partes_entrega_id_pregunta_id_pk" PRIMARY KEY("entrega_id","pregunta_id")
);
--> statement-breakpoint
ALTER TABLE "entregas" ADD COLUMN "sin_parte" text[];--> statement-breakpoint
CREATE INDEX "partes_tarea_idx" ON "partes" USING btree ("tarea_id");