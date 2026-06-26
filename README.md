# Barber Click

Barber Click e um MVP mobile de marketplace de agendamento para barbearias. O aplicativo conecta clientes que querem encontrar, avaliar e reservar horarios em barbearias com barbeiros que precisam cadastrar seus estabelecimentos, organizar servicos, controlar agenda e gerenciar pedidos de atendimento.

O projeto foi desenvolvido em React Native com Expo e Supabase, com foco em fluxo real de produto: autenticacao, perfis de usuario, cadastro de barbearias, horarios de funcionamento, capacidade por horario, agendamento atomico, aprovacao, recusa, cancelamento, favoritos e avaliacoes.

## Visao Geral

O MVP resolve um problema comum de barbearias pequenas: centralizar divulgacao, disponibilidade e agendamentos em uma experiencia simples para celular.

Para o cliente, o app funciona como uma vitrine de barbearias, permitindo buscar estabelecimentos, consultar detalhes, favoritar, escolher servicos e acompanhar o status dos pedidos. Para o barbeiro, o app oferece um painel operacional para cadastrar a barbearia, configurar agenda, gerenciar servicos e controlar os agendamentos recebidos.

## Principais Funcionalidades

### Cliente

- Listagem e busca de barbearias.
- Visualizacao de detalhes do estabelecimento, endereco, mapa, servicos, horarios e avaliacao media.
- Favoritos por usuario.
- Agendamento com escolha de servico, data e horario disponivel.
- Acompanhamento de agendamentos com status `pendente`, `aprovado`, `recusado` e `cancelado`.
- Cancelamento de pedidos pendentes ou aprovados com pelo menos duas horas de antecedencia.
- Avaliacao da barbearia apos atendimento concluido.
- Badge na aba de agendamentos quando existem pedidos pendentes.

### Barbeiro

- Cadastro e edicao de barbearias.
- Upload de foto/logo do estabelecimento.
- Configuracao de localizacao no mapa.
- Cadastro e edicao de servicos com preco.
- Configuracao de horarios de funcionamento por dia da semana.
- Configuracao da duracao media do atendimento.
- Configuracao da capacidade de atendimentos por horario.
- Agenda com pedidos pendentes e atendimentos aprovados.
- Aprovacao ou recusa de pedidos pendentes.
- Cancelamento de agendamentos aprovados com pelo menos duas horas de antecedencia.
- Badge na aba de agenda quando existem pedidos pendentes.

### Conta e Perfil

- Cadastro com perfil de cliente ou barbeiro.
- Login com e-mail e senha.
- Bloqueio/desbloqueio de sessao com biometria.
- Atualizacao de foto de perfil.
- Alteracao de e-mail e senha.
- Logout seguro.
- Exclusao de conta com limpeza de dados relacionados.

## Stack Tecnica

- React Native 0.81
- Expo SDK 54
- Expo Router
- Supabase Auth
- Supabase Database
- Supabase Storage
- Supabase Row Level Security
- Supabase RPC / PLpgSQL
- React Context API
- React Native Maps
- Expo Location
- Expo Image Picker
- Expo Local Authentication
- Expo Secure Store
- Jest
- React Testing Library
- ESLint

## Arquitetura

O app usa Expo Router para organizar as rotas mobile e React Context para centralizar regras de dominio no cliente.

- `AuthContext`: autenticacao, sessao, biometria, perfil, avatar, alteracao de credenciais e exclusao de conta.
- `BarbershopContext`: listagem, favoritos, avaliacoes, cadastro/edicao de barbearias, servicos, imagens e horarios.
- `AppointmentContext`: carregamento de agendamentos, reserva, aprovacao, recusa e cancelamento.

As regras criticas de agenda ficam no banco via RPCs, evitando depender apenas da interface:

- `book_appointment`: cria agendamentos de forma atomica, validando autenticacao, servico, horario de funcionamento, data futura e capacidade.
- `update_appointment_status`: permite ao dono da barbearia aprovar ou recusar apenas pedidos pendentes.
- `cancel_appointment`: permite cancelamento por cliente ou barbeiro respeitando permissao, status elegivel e antecedencia minima.
- `rate_barbershop`: registra ou atualiza avaliacao e recalcula a media da barbearia.
- `delete_user`: remove conta e dados relacionados do usuario autenticado.

## Modelagem de Dados

Principais entidades usadas pelo MVP:

- `profiles`: dados publicos do usuario, tipo de conta e avatar.
- `barbershops`: estabelecimentos cadastrados pelos barbeiros.
- `business_hours`: horarios de funcionamento por dia da semana.
- `services`: servicos oferecidos por cada barbearia.
- `appointments`: pedidos de agendamento e ciclo de status.
- `favorites`: relacao entre clientes e barbearias favoritas.
- `reviews`: avaliacoes de clientes para barbearias.

## Fluxos Principais

### Cadastro de Barbearia

O barbeiro informa nome, descricao, imagem, localizacao, horarios, duracao media e capacidade por horario. A barbearia pode ser criada mesmo que todos os dias estejam fechados, permitindo ao barbeiro abrir a agenda posteriormente pela edicao.

### Agendamento

O cliente escolhe uma barbearia, seleciona um servico, data e horario. O app mostra apenas horarios validos conforme funcionamento, duracao, capacidade e ocupacao atual. A confirmacao passa pela RPC `book_appointment`, que aplica as mesmas regras no banco.

### Gestao da Agenda

O barbeiro recebe pedidos pendentes, podendo aprovar ou recusar. Agendamentos aprovados aparecem na agenda ativa e podem ser filtrados por dia. Pendentes aparecem em destaque e tambem alimentam o badge da aba.

### Cancelamento

Cliente e barbeiro podem cancelar agendamentos respeitando regras diferentes:

- Cliente pode cancelar pedidos pendentes ou aprovados.
- Barbeiro pode cancelar agendamentos aprovados.
- Ambos precisam cancelar com pelo menos duas horas de antecedencia.
- Cancelamentos liberam a capacidade do horario.

### Avaliacao

Clientes podem avaliar uma barbearia apos um atendimento aprovado e ja ocorrido. A nota e registrada em `reviews`, e a media e refletida em `barbershops.rating`.

## Seguranca e Consistencia

- RLS habilitado nas tabelas auxiliares adicionadas por migrations.
- Policies de Storage para avatars restringindo escrita, atualizacao e remocao ao proprio usuario.
- Upload de imagem com fluxo resiliente: envia nova imagem, atualiza banco e limpa arquivo anterior.
- Biometria sem armazenar e-mail ou senha em texto puro.
- RPCs com `security definer` para operacoes sensiveis de agenda.
- Insert direto em `appointments` bloqueado; reservas passam por RPC atomica.
- Atualizacao direta de status bloqueada; status passa por RPC validada.
- Capacidade por horario protegida no banco com advisory lock.

## Como Rodar

### Pre-requisitos

- Node.js
- npm
- Expo CLI via `npx expo`
- Projeto Supabase configurado
- Android Studio ou dispositivo fisico para execucao Android

### Variaveis de Ambiente

Crie um arquivo `.env` com base em `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

### Instalacao

```bash
npm install
```

### Execucao

```bash
npm run start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Web:

```bash
npm run web
```

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run test
npm run test:watch
npm run test:coverage
npm run doctor
npm run bundle:android
npm run verify
```

O script `verify` executa lint, Expo Doctor e exportacao do bundle Android.

## Supabase

As migrations ficam em `supabase/migrations` e cobrem:

- Policies do bucket `avatars`.
- Status `cancelado` no enum de agendamentos.
- Cancelamento seguro compartilhado entre cliente e barbeiro.
- Exclusao de conta por RPC.
- Favoritos.
- Avaliacoes.
- Remocao de constraint legada de horario unico para suportar capacidade configuravel.

Para um ambiente novo, aplique as migrations na ordem dos timestamps. O status `cancelado` fica em uma migration propria porque enums do PostgreSQL precisam ser confirmados antes de serem usados em constraints e funcoes posteriores.

Buckets esperados:

- `avatars`: fotos de perfil.
- `barbershops`: imagens das barbearias.

## Qualidade

O projeto possui testes unitarios para contextos, utilitarios, storage, hooks e integracao basica com o mock do Supabase.

Comandos principais de validacao:

```bash
npm run lint
npm run test
npm run doctor
npm run bundle:android
npm run verify
```

## Roadmap

- Push notifications para avisar barbeiros e clientes fora do app.
- Pagamentos e sinal de reserva.
- Dashboard financeiro para barbeiros.
- Historico avancado de atendimentos.
- Busca por proximidade usando geolocalizacao.
- Melhorias de UX para reagendamento.
- Publicacao em lojas.

## Autores

- Gabriel Fernandes de Freitas Moreira Duarte de Lima
- Kaue da Conceicao Alves
- Ian Candido de Souza
