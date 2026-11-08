CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ajustes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"destino" text NOT NULL,
	"destino_id" text NOT NULL,
	"seccion" text NOT NULL,
	"motivo_id" text NOT NULL,
	"motivo" text NOT NULL,
	"valor" double precision NOT NULL,
	"nota" text,
	"autor_id" text,
	"en" bigint NOT NULL,
	"anula_a" text
);
--> statement-breakpoint
CREATE TABLE "config" (
	"id" text PRIMARY KEY NOT NULL,
	"datos" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entregas" (
	"id" text PRIMARY KEY NOT NULL,
	"tarea_id" text NOT NULL,
	"tipo" text NOT NULL,
	"titular_id" text NOT NULL,
	"titular_nombre" text,
	"seccion" text NOT NULL,
	"integrantes" text[] NOT NULL,
	"estado" text NOT NULL,
	"respuestas" jsonb NOT NULL,
	"enviada_por" text,
	"enviada_en" bigint,
	"evaluacion" jsonb,
	"evaluacion_anterior" jsonb
);
--> statement-breakpoint
CREATE TABLE "equipos" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"seccion" text NOT NULL,
	"tema" text,
	"capitan_id" text,
	"logo_path" text
);
--> statement-breakpoint
CREATE TABLE "historial_base" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"alumno_id" text NOT NULL,
	"de" double precision NOT NULL,
	"a" double precision NOT NULL,
	"motivo" text NOT NULL,
	"autor_id" text NOT NULL,
	"en" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operaciones" (
	"id" text PRIMARY KEY NOT NULL,
	"datos" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presencia" (
	"alumno_id" text NOT NULL,
	"profe_id" text NOT NULL,
	"nombre" text NOT NULL,
	"desde" bigint NOT NULL,
	"latido" bigint NOT NULL,
	CONSTRAINT "presencia_alumno_id_profe_id_pk" PRIMARY KEY("alumno_id","profe_id")
);
--> statement-breakpoint
CREATE TABLE "ranking" (
	"seccion" text PRIMARY KEY NOT NULL,
	"alumnos" jsonb NOT NULL,
	"equipos" jsonb NOT NULL,
	"actualizado_en" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "recuperaciones" (
	"cedula" text PRIMARY KEY NOT NULL,
	"envios" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"secciones" text[] NOT NULL,
	"estado" text NOT NULL,
	"fecha_entrega" text,
	"premio" text,
	"premio_foto" text,
	"preguntas" jsonb NOT NULL,
	"importada" boolean DEFAULT false NOT NULL,
	"autor_id" text,
	"actualizado_en" bigint NOT NULL,
	"decisiones_premio" jsonb
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"cedula" text PRIMARY KEY NOT NULL,
	"rol" text NOT NULL,
	"nombres" text NOT NULL,
	"apellidos" text NOT NULL,
	"seccion" text,
	"equipo_id" text,
	"base" double precision NOT NULL,
	"avatar" jsonb NOT NULL,
	"apariencia" jsonb,
	"admin" boolean DEFAULT false NOT NULL,
	"debe_cambiar_password" boolean DEFAULT false NOT NULL,
	"email_recuperacion" text,
	"actualizado_en" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cedula_user_id_fk" FOREIGN KEY ("cedula") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ajustes_seccion_idx" ON "ajustes" USING btree ("seccion");--> statement-breakpoint
CREATE INDEX "ajustes_destino_idx" ON "ajustes" USING btree ("destino_id");--> statement-breakpoint
CREATE INDEX "entregas_tarea_idx" ON "entregas" USING btree ("tarea_id");--> statement-breakpoint
CREATE INDEX "entregas_seccion_idx" ON "entregas" USING btree ("seccion");--> statement-breakpoint
CREATE INDEX "entregas_integrantes_idx" ON "entregas" USING gin ("integrantes");--> statement-breakpoint
CREATE INDEX "equipos_seccion_idx" ON "equipos" USING btree ("seccion");--> statement-breakpoint
CREATE INDEX "historial_base_alumno_idx" ON "historial_base" USING btree ("alumno_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usuarios_seccion_idx" ON "usuarios" USING btree ("seccion");--> statement-breakpoint
CREATE INDEX "usuarios_equipo_idx" ON "usuarios" USING btree ("equipo_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");