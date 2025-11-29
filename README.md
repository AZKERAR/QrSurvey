# QrSurvey

Sistema de encuestas con QR para respuestas en tiempo real.

## 📋 Características

- **Autenticación de usuarios** con roles (admin/respondent)
- **Creación de encuestas** con múltiples preguntas
- **Generación de códigos QR** para compartir encuestas
- **Respuestas en tiempo real**
- **Gráficos de resultados** con visualización de datos
- **Backend con Supabase** (PostgreSQL + Auth + RLS)

## 🚀 Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Gráficos**: Recharts
- **QR**: qrcode.react
- **Routing**: React Router
- **Styling**: CSS modules

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/AZKERAR/QrSurvey.git
cd QrSurvey
```

2. Instala las dependencias:
```bash
pnpm install
```

3. Configura las variables de entorno:
   - Copia `.env.example` a `.env`
   - Completa las credenciales de Supabase:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

Para obtener estas credenciales:
- Ve a tu proyecto en [Supabase](https://app.supabase.com)
- Settings → API
- Copia `Project URL` y `anon/public key`

4. Ejecuta el proyecto en desarrollo:
```bash
pnpm dev
```

## 🗄️ Configuración de Base de Datos

### Estructura de tablas

Ejecuta estos scripts en el SQL Editor de Supabase:

```sql
-- 1) Tabla de perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'respondent')) default 'respondent',
  created_at timestamptz not null default now()
);

-- 2) Tabla de encuestas
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  public_slug text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Tabla de preguntas
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_text text not null,
  type text not null check (type in ('single_choice')),
  options jsonb not null,
  "order" integer not null default 1
);

-- 4) Tabla de respuestas
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  device_info jsonb,
  metadata jsonb
);

-- 5) Tabla de respuestas por pregunta
create table if not exists public.response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_value jsonb not null
);
```

### Trigger para crear perfiles automáticamente

```sql
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'respondent',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists create_profile_on_auth_user on auth.users;
create trigger create_profile_on_auth_user
  after insert on auth.users
  for each row
  execute procedure public.handle_new_auth_user();
```

### Políticas RLS (Row Level Security)

```sql
-- Policies para surveys
CREATE POLICY "Anyone can view active surveys" ON public.surveys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can create surveys" ON public.surveys
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own surveys" ON public.surveys
  FOR UPDATE USING (auth.uid() = owner_id);

-- Policies para questions
CREATE POLICY "Anyone can view questions" ON public.questions
  FOR SELECT USING (true);

CREATE POLICY "Survey owners can create questions" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND owner_id = auth.uid())
  );

-- Policies para responses
CREATE POLICY "Users can view own responses" ON public.responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create responses" ON public.responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para response_answers
CREATE POLICY "Users can view own answers" ON public.response_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM responses WHERE id = response_id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create answers" ON public.response_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM responses WHERE id = response_id AND user_id = auth.uid())
  );

-- Policies para profiles
CREATE POLICY "Users can view and edit own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users during registration" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 👥 Roles de Usuario

### Admin
- Crear encuestas
- Agregar preguntas a encuestas
- Ver resultados y gráficos de todas sus encuestas
- Generar códigos QR

### Respondent
- Responder encuestas mediante QR
- Ver gráficos de las encuestas que han respondido

## 📱 Flujo de Uso

### Como Admin:
1. Inicia sesión con cuenta admin
2. Crea una nueva encuesta (título y descripción)
3. Agrega preguntas con opciones de respuesta
4. Finaliza y obtén el código QR
5. Comparte el QR con los usuarios
6. Visualiza los resultados en tiempo real

### Como Respondent:
1. Escanea el código QR
2. Regístrate o inicia sesión
3. Responde la encuesta
4. Visualiza los resultados al terminar

## 🚀 Despliegue en Vercel

1. Importa el repositorio en Vercel
2. Configura las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Despliega

## 📝 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build para producción
pnpm preview      # Preview del build
pnpm lint         # Linter ESLint
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto.

## 👨‍💻 Autor

**AZKERAR**
- GitHub: [@AZKERAR](https://github.com/AZKERAR)
