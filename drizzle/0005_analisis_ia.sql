CREATE TABLE "analisis_ia" (
	"entrega_id" text NOT NULL,
	"pregunta_id" text NOT NULL,
	"porcentaje" integer NOT NULL,
	"huella" text NOT NULL,
	"modelo" text NOT NULL,
	"autor_id" text NOT NULL,
	"analizado_en" bigint NOT NULL,
	CONSTRAINT "analisis_ia_entrega_id_pregunta_id_pk" PRIMARY KEY("entrega_id","pregunta_id")
);
