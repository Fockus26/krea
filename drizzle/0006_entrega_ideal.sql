CREATE TABLE "ideales" (
	"tarea_id" text PRIMARY KEY NOT NULL,
	"entrega_id" text,
	"respuestas" jsonb,
	"nota" text NOT NULL,
	"notas" jsonb NOT NULL,
	"autor_id" text NOT NULL,
	"actualizado_en" bigint NOT NULL,
	CONSTRAINT "ideales_una_forma" CHECK (("ideales"."entrega_id" IS NULL) <> ("ideales"."respuestas" IS NULL))
);
