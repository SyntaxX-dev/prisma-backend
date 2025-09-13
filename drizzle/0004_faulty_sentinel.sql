CREATE TYPE "public"."college_course" AS ENUM('MEDICINA', 'ENGENHARIA', 'DIREITO', 'ADMINISTRACAO', 'CONTABILIDADE', 'PSICOLOGIA', 'PEDAGOGIA', 'ENFERMAGEM', 'FARMACIA', 'FISIOTERAPIA', 'ODONTOLOGIA', 'VETERINARIA', 'ARQUITETURA', 'CIENCIA_COMPUTACAO', 'SISTEMAS_INFORMACAO', 'JORNALISMO', 'PUBLICIDADE', 'MARKETING', 'ECONOMIA', 'RELACOES_INTERNACIONAIS', 'OUTROS');--> statement-breakpoint
CREATE TYPE "public"."contest_type" AS ENUM('PRF', 'ESA', 'DATAPREV', 'POLICIA_CIVIL', 'POLICIA_MILITAR', 'BOMBEIROS', 'TJ', 'MP', 'TRF', 'TRE', 'TRT', 'INSS', 'IBGE', 'ANAC', 'ANATEL', 'BACEN', 'CVM', 'SUSEP', 'PREVIC', 'OUTROS');--> statement-breakpoint
CREATE TYPE "public"."user_focus" AS ENUM('ENEM', 'CONCURSO', 'ENSINO_MEDIO', 'FACULDADE');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_focus" "user_focus";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contest_type" "contest_type";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "college_course" "college_course";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badge" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_profile_complete" text DEFAULT 'false' NOT NULL;