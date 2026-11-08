CREATE TABLE "push_suscripciones" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"cedula" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"creado_en" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_suscripciones" ADD CONSTRAINT "push_suscripciones_cedula_usuarios_cedula_fk" FOREIGN KEY ("cedula") REFERENCES "public"."usuarios"("cedula") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_suscripciones_cedula_idx" ON "push_suscripciones" USING btree ("cedula");