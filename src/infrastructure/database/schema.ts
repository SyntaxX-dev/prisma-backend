import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'ADMIN', 'PRODUCER']);
export const educationLevelEnum = pgEnum('education_level', [
  'ELEMENTARY',
  'HIGH_SCHOOL',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'MASTER',
  'DOCTORATE',
]);
export const userFocusEnum = pgEnum('user_focus', [
  'ENEM',
  'CONCURSO',
  'ENSINO_MEDIO',
  'FACULDADE',
]);
export const contestTypeEnum = pgEnum('contest_type', [
  'PRF',
  'ESA',
  'DATAPREV',
  'POLICIA_CIVIL',
  'POLICIA_MILITAR',
  'BOMBEIROS',
  'TJ',
  'MP',
  'TRF',
  'TRE',
  'TRT',
  'TCU',
  'INSS',
  'IBGE',
  'ANAC',
  'ANATEL',
  'BACEN',
  'CVM',
  'SUSEP',
  'PREVIC',
  'OUTROS',
]);
export const collegeCourseEnum = pgEnum('college_course', [
  'MEDICINA',
  'ENGENHARIA',
  'DIREITO',
  'ADMINISTRACAO',
  'CONTABILIDADE',
  'PSICOLOGIA',
  'PEDAGOGIA',
  'ENFERMAGEM',
  'FARMACIA',
  'FISIOTERAPIA',
  'ODONTOLOGIA',
  'VETERINARIA',
  'ARQUITETURA',
  'CIENCIA_COMPUTACAO',
  'SISTEMAS_INFORMACAO',
  'JORNALISMO',
  'PUBLICIDADE',
  'MARKETING',
  'ECONOMIA',
  'RELACOES_INTERNACIONAIS',
  'OUTROS',
]);
export const offensiveTypeEnum = pgEnum('offensive_type', [
  'NORMAL',
  'SUPER',
  'ULTRA',
  'KING',
  'INFINITY',
]);
export const communityVisibilityEnum = pgEnum('community_visibility', [
  'PUBLIC',
  'PRIVATE',
]);
export const friendRequestStatusEnum = pgEnum('friend_request_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
]);
export const locationVisibilityEnum = pgEnum('location_visibility', [
  'PUBLIC',
  'STATE_ONLY',
  'PRIVATE',
]);

export const generationTypeEnum = pgEnum('generation_type', [
  'mindmap',
  'text',
]);

export const quizStatusEnum = pgEnum('quiz_status', [
  'IN_PROGRESS',
  'COMPLETED',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    age: integer('age'),
    role: userRoleEnum('role'),
    educationLevel: educationLevelEnum('education_level'),
    userFocus: userFocusEnum('user_focus'),
    contestType: contestTypeEnum('contest_type'),
    collegeCourse: collegeCourseEnum('college_course'),
    badge: text('badge'),
    isProfileComplete: text('is_profile_complete').notNull().default('false'),
    // Novos campos do perfil
    profileImage: text('profile_image'),
    linkedin: text('linkedin'),
    github: text('github'),
    portfolio: text('portfolio'),
    aboutYou: text('about_you'),
    habilities: text('habilities'),
    momentCareer: text('moment_career'),
    location: text('location'),
    locationVisibility: locationVisibilityEnum('location_visibility')
      .notNull()
      .default('PUBLIC'),
    instagram: text('instagram'),
    twitter: text('twitter'),
    socialLinksOrder: text('social_links_order'),
    // Limite de gerações de mapa mental (visual)
    mindMapGenerationsToday: integer('mind_map_generations_today').notNull().default(0),
    mindMapLastResetDate: timestamp('mind_map_last_reset_date', { withTimezone: false }),
    mindMapDailyLimit: integer('mind_map_daily_limit').notNull().default(5),
    // Limite de gerações de texto/resumo
    textGenerationsToday: integer('text_generations_today').notNull().default(0),
    textLastResetDate: timestamp('text_last_reset_date', { withTimezone: false }),
    textDailyLimit: integer('text_daily_limit').notNull().default(5),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_unique').on(table.email),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    isPaid: text('is_paid').notNull().default('false'),
    isProducerCourse: text('is_producer_course').notNull().default('false'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex('courses_name_unique').on(table.name),
    createdAtIdx: index('courses_created_at_idx').on(table.createdAt),
  }),
);

export const subCourses = pgTable(
  'sub_courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    courseIdIdx: index('sub_courses_course_id_idx').on(table.courseId),
    orderIdx: index('sub_courses_order_idx').on(table.order),
    createdAtIdx: index('sub_courses_created_at_idx').on(table.createdAt),
  }),
);

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subCourseId: uuid('sub_course_id')
      .notNull()
      .references(() => subCourses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    videoCount: integer('video_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    subCourseIdIdx: index('modules_sub_course_id_idx').on(table.subCourseId),
    orderIdx: index('modules_order_idx').on(table.order),
    createdAtIdx: index('modules_created_at_idx').on(table.createdAt),
  }),
);

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    subCourseId: uuid('sub_course_id')
      .notNull()
      .references(() => subCourses.id, { onDelete: 'cascade' }),
    videoId: text('video_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    duration: integer('duration'),
    channelTitle: text('channel_title'),
    channelId: text('channel_id'),
    channelThumbnailUrl: text('channel_thumbnail_url'),
    publishedAt: timestamp('published_at', { withTimezone: false }),
    viewCount: integer('view_count'),
    tags: text('tags').array(),
    category: text('category'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    videoIdIdx: uniqueIndex('videos_video_id_unique').on(table.videoId),
    moduleIdIdx: index('videos_module_id_idx').on(table.moduleId),
    subCourseIdIdx: index('videos_sub_course_id_idx').on(table.subCourseId),
    orderIdx: index('videos_order_idx').on(table.order),
    createdAtIdx: index('videos_created_at_idx').on(table.createdAt),
  }),
);

export const videoProgress = pgTable(
  'video_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    subCourseId: uuid('sub_course_id')
      .notNull()
      .references(() => subCourses.id, { onDelete: 'cascade' }),
    isCompleted: text('is_completed').notNull().default('false'),
    completedAt: timestamp('completed_at', { withTimezone: false }),
    currentTimestamp: integer('current_timestamp'), // Posição atual em segundos
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userVideoIdx: uniqueIndex('video_progress_user_video_unique').on(
      table.userId,
      table.videoId,
    ),
    userIdIdx: index('video_progress_user_id_idx').on(table.userId),
    videoIdIdx: index('video_progress_video_id_idx').on(table.videoId),
    subCourseIdIdx: index('video_progress_sub_course_id_idx').on(
      table.subCourseId,
    ),
    createdAtIdx: index('video_progress_created_at_idx').on(table.createdAt),
  }),
);

export const offensives = pgTable(
  'offensives',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: offensiveTypeEnum('type').notNull().default('NORMAL'),
    consecutiveDays: integer('consecutive_days').notNull().default(0),
    lastVideoCompletedAt: timestamp('last_video_completed_at', {
      withTimezone: false,
    })
      .notNull()
      .defaultNow(),
    streakStartDate: timestamp('streak_start_date', { withTimezone: false })
      .notNull()
      .defaultNow(),
    totalOffensives: integer('total_offensives').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('offensives_user_id_unique').on(table.userId),
    typeIdx: index('offensives_type_idx').on(table.type),
    consecutiveDaysIdx: index('offensives_consecutive_days_idx').on(
      table.consecutiveDays,
    ),
    createdAtIdx: index('offensives_created_at_idx').on(table.createdAt),
  }),
);

export const communities = pgTable(
  'communities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    focus: text('focus').notNull(),
    description: text('description'),
    image: text('image'),
    visibility: communityVisibilityEnum('visibility')
      .notNull()
      .default('PUBLIC'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex('communities_name_unique').on(table.name),
    ownerIdIdx: index('communities_owner_id_idx').on(table.ownerId),
    visibilityIdx: index('communities_visibility_idx').on(table.visibility),
    focusIdx: index('communities_focus_idx').on(table.focus),
    createdAtIdx: index('communities_created_at_idx').on(table.createdAt),
  }),
);

export const communityMembers = pgTable(
  'community_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    communityUserIdx: uniqueIndex('community_members_community_user_unique').on(
      table.communityId,
      table.userId,
    ),
    communityIdIdx: index('community_members_community_id_idx').on(
      table.communityId,
    ),
    userIdIdx: index('community_members_user_id_idx').on(table.userId),
    joinedAtIdx: index('community_members_joined_at_idx').on(table.joinedAt),
  }),
);

export const communityInvites = pgTable(
  'community_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    inviterId: uuid('inviter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    inviteeUsername: text('invitee_username').notNull(),
    inviteeId: uuid('invitee_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    status: text('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    communityInviteeIdx: uniqueIndex(
      'community_invites_community_invitee_unique',
    ).on(table.communityId, table.inviteeUsername),
    communityIdIdx: index('community_invites_community_id_idx').on(
      table.communityId,
    ),
    inviteeUsernameIdx: index('community_invites_invitee_username_idx').on(
      table.inviteeUsername,
    ),
    inviteeIdIdx: index('community_invites_invitee_id_idx').on(table.inviteeId),
    statusIdx: index('community_invites_status_idx').on(table.status),
    createdAtIdx: index('community_invites_created_at_idx').on(table.createdAt),
  }),
);

export const friendRequests = pgTable(
  'friend_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: friendRequestStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    requesterReceiverIdx: uniqueIndex(
      'friend_requests_requester_receiver_unique',
    ).on(table.requesterId, table.receiverId),
    requesterIdIdx: index('friend_requests_requester_id_idx').on(
      table.requesterId,
    ),
    receiverIdIdx: index('friend_requests_receiver_id_idx').on(
      table.receiverId,
    ),
    statusIdx: index('friend_requests_status_idx').on(table.status),
    createdAtIdx: index('friend_requests_created_at_idx').on(table.createdAt),
  }),
);

export const friendships = pgTable(
  'friendships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId1: uuid('user_id_1')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userId2: uuid('user_id_2')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userPairIdx: uniqueIndex('friendships_user_pair_unique').on(
      table.userId1,
      table.userId2,
    ),
    userId1Idx: index('friendships_user_id_1_idx').on(table.userId1),
    userId2Idx: index('friendships_user_id_2_idx').on(table.userId2),
    createdAtIdx: index('friendships_created_at_idx').on(table.createdAt),
  }),
);

export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    blockerBlockedIdx: uniqueIndex('blocks_blocker_blocked_unique').on(
      table.blockerId,
      table.blockedId,
    ),
    blockerIdIdx: index('blocks_blocker_id_idx').on(table.blockerId),
    blockedIdIdx: index('blocks_blocked_id_idx').on(table.blockedId),
    createdAtIdx: index('blocks_created_at_idx').on(table.createdAt),
  }),
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    relatedUserId: uuid('related_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    relatedEntityId: uuid('related_entity_id'), // ID de outra entidade (pedido de amizade, etc)
    isRead: text('is_read').notNull().default('false'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    typeIdx: index('notifications_type_idx').on(table.type),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Tabela messages - Armazena mensagens de chat entre usuários
 *
 * Esta tabela armazena todas as mensagens trocadas entre usuários que são amigos.
 * Ela mantém o histórico completo de conversas e permite rastrear mensagens não lidas.
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // Conteúdo da mensagem
    isRead: text('is_read').notNull().default('false'), // 'true' ou 'false' como string
    readAt: timestamp('read_at', { withTimezone: false }), // Quando foi lida (null se não foi)
    updatedAt: timestamp('updated_at', { withTimezone: false }), // Quando foi editada (null se nunca foi editada)
    isDeleted: text('is_deleted').notNull().default('false'), // 'true' ou 'false' como string - se a mensagem foi deletada
    deletedAt: timestamp('deleted_at', { withTimezone: false }), // Quando foi deletada (null se não foi)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar mensagens entre dois usuários rapidamente
    senderReceiverIdx: index('messages_sender_receiver_idx').on(
      table.senderId,
      table.receiverId,
    ),
    // Índice para buscar mensagens não lidas de um usuário
    receiverUnreadIdx: index('messages_receiver_unread_idx').on(
      table.receiverId,
      table.isRead,
    ),
    // Índice para ordenar por data de criação
    createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
    // Índice para buscar por sender
    senderIdIdx: index('messages_sender_id_idx').on(table.senderId),
    // Índice para buscar por receiver
    receiverIdIdx: index('messages_receiver_id_idx').on(table.receiverId),
  }),
);

/**
 * Tabela pinned_messages - Armazena mensagens fixadas em conversas
 *
 * Esta tabela permite que usuários fixem mensagens importantes em uma conversa.
 * Cada conversa pode ter múltiplas mensagens fixadas.
 */
export const pinnedMessages = pgTable(
  'pinned_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    pinnedBy: uuid('pinned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // IDs dos dois usuários da conversa (para facilitar busca)
    userId1: uuid('user_id_1')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userId2: uuid('user_id_2')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pinnedAt: timestamp('pinned_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar mensagens fixadas de uma conversa
    conversationIdx: index('pinned_messages_conversation_idx').on(
      table.userId1,
      table.userId2,
    ),
    // Índice para buscar por mensagem
    messageIdIdx: index('pinned_messages_message_id_idx').on(table.messageId),
    // Índice para ordenar por data de fixação
    pinnedAtIdx: index('pinned_messages_pinned_at_idx').on(table.pinnedAt),
    // Índice único: uma mensagem só pode ser fixada uma vez
    messageIdUniqueIdx: uniqueIndex('pinned_messages_message_id_unique').on(
      table.messageId,
    ),
  }),
);

/**
 * Tabela community_messages - Armazena mensagens em comunidades
 *
 * Esta tabela armazena mensagens enviadas em comunidades (chat de grupo).
 * Similar à tabela messages, mas para contexto de comunidades.
 */
export const communityMessages = pgTable(
  'community_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // Conteúdo da mensagem
    updatedAt: timestamp('updated_at', { withTimezone: false }), // Quando foi editada (null se nunca foi editada)
    isDeleted: text('is_deleted').notNull().default('false'), // 'true' ou 'false' como string - se a mensagem foi deletada
    deletedAt: timestamp('deleted_at', { withTimezone: false }), // Quando foi deletada (null se não foi)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar mensagens de uma comunidade rapidamente
    communityIdIdx: index('community_messages_community_id_idx').on(
      table.communityId,
    ),
    // Índice para ordenar por data de criação
    createdAtIdx: index('community_messages_created_at_idx').on(
      table.createdAt,
    ),
    // Índice para buscar por sender
    senderIdIdx: index('community_messages_sender_id_idx').on(table.senderId),
    // Índice composto para buscar mensagens de uma comunidade ordenadas por data
    communityCreatedIdx: index('community_messages_community_created_idx').on(
      table.communityId,
      table.createdAt,
    ),
  }),
);

/**
 * Tabela pinned_community_messages - Armazena mensagens fixadas em comunidades
 *
 * Esta tabela permite que usuários fixem mensagens importantes em uma comunidade.
 * Cada comunidade pode ter múltiplas mensagens fixadas.
 */
export const pinnedCommunityMessages = pgTable(
  'pinned_community_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => communityMessages.id, { onDelete: 'cascade' }),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    pinnedBy: uuid('pinned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pinnedAt: timestamp('pinned_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar mensagens fixadas de uma comunidade
    communityIdIdx: index('pinned_community_messages_community_id_idx').on(
      table.communityId,
    ),
    // Índice para buscar por mensagem
    messageIdIdx: index('pinned_community_messages_message_id_idx').on(
      table.messageId,
    ),
    // Índice para ordenar por data de fixação
    pinnedAtIdx: index('pinned_community_messages_pinned_at_idx').on(
      table.pinnedAt,
    ),
    // Índice único: uma mensagem só pode ser fixada uma vez
    messageIdUniqueIdx: uniqueIndex(
      'pinned_community_messages_message_id_unique',
    ).on(table.messageId),
  }),
);

/**
 * Tabela message_attachments - Armazena anexos de mensagens pessoais
 *
 * Esta tabela armazena arquivos (imagens, PDFs, etc) anexados a mensagens.
 * Os arquivos são armazenados no Cloudinary, apenas a URL e metadados ficam no banco.
 */
export const messageAttachments = pgTable(
  'message_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    fileUrl: text('file_url').notNull(), // URL do arquivo no Cloudinary
    fileName: text('file_name').notNull(), // Nome original do arquivo
    fileType: text('file_type').notNull(), // MIME type (ex: image/jpeg, application/pdf)
    fileSize: integer('file_size').notNull(), // Tamanho em bytes
    cloudinaryPublicId: text('cloudinary_public_id').notNull(), // Public ID no Cloudinary (para deletar)
    thumbnailUrl: text('thumbnail_url'), // URL do thumbnail (para imagens/vídeos)
    width: integer('width'), // Largura (para imagens/vídeos)
    height: integer('height'), // Altura (para imagens/vídeos)
    duration: integer('duration'), // Duração em segundos (para vídeos/áudio)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar anexos de uma mensagem
    messageIdIdx: index('message_attachments_message_id_idx').on(
      table.messageId,
    ),
    // Índice para ordenar por data
    createdAtIdx: index('message_attachments_created_at_idx').on(
      table.createdAt,
    ),
  }),
);

/**
 * Tabela community_message_attachments - Armazena anexos de mensagens de comunidades
 *
 * Esta tabela armazena arquivos anexados a mensagens de comunidades.
 */
export const communityMessageAttachments = pgTable(
  'community_message_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => communityMessages.id, { onDelete: 'cascade' }),
    fileUrl: text('file_url').notNull(), // URL do arquivo no Cloudinary
    fileName: text('file_name').notNull(), // Nome original do arquivo
    fileType: text('file_type').notNull(), // MIME type
    fileSize: integer('file_size').notNull(), // Tamanho em bytes
    cloudinaryPublicId: text('cloudinary_public_id').notNull(), // Public ID no Cloudinary
    thumbnailUrl: text('thumbnail_url'), // URL do thumbnail
    width: integer('width'), // Largura
    height: integer('height'), // Altura
    duration: integer('duration'), // Duração em segundos
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar anexos de uma mensagem
    messageIdIdx: index('community_message_attachments_message_id_idx').on(
      table.messageId,
    ),
    // Índice para ordenar por data
    createdAtIdx: index('community_message_attachments_created_at_idx').on(
      table.createdAt,
    ),
  }),
);

/**
 * Tabela user_push_subscriptions - Armazena subscriptions de Web Push
 *
 * Esta tabela armazena as subscriptions de push notifications dos usuários.
 * Permite enviar notificações mesmo quando o usuário está offline.
 */
export const userPushSubscriptions = pgTable(
  'user_push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(), // URL do serviço push (FCM endpoint)
    p256dh: text('p256dh').notNull(), // Chave pública do cliente
    auth: text('auth').notNull(), // Segredo de autenticação
    token: text('token'), // Token FCM (opcional, para compatibilidade)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar subscriptions de um usuário
    userIdIdx: index('user_push_subscriptions_user_id_idx').on(table.userId),
    // Índice único para endpoint (um endpoint por subscription)
    endpointIdx: uniqueIndex('user_push_subscriptions_endpoint_idx').on(
      table.endpoint,
    ),
  }),
);

/**
 * Tabela mind_maps - Armazena mapas mentais gerados por IA para vídeos
 *
 * Esta tabela armazena os mapas mentais focados em ENEM gerados pela IA Gemini.
 * Permite reutilizar mapas já gerados ao invés de gerar novamente.
 */
export const mindMaps = pgTable(
  'mind_maps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // Conteúdo do mapa mental em Markdown
    videoTitle: text('video_title').notNull(), // Título do vídeo (para referência)
    videoUrl: text('video_url').notNull(), // URL do vídeo
    generationType: generationTypeEnum('generation_type').notNull().default('mindmap'), // Tipo de geração: mindmap ou text
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar mapas mentais de um usuário
    userIdIdx: index('mind_maps_user_id_idx').on(table.userId),
    // Índice para buscar mapa mental de um vídeo específico de um usuário
    userVideoIdx: index('mind_maps_user_video_idx').on(
      table.userId,
      table.videoId,
    ),
    // Índice para ordenar por data de criação
    createdAtIdx: index('mind_maps_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Tabela call_rooms - Armazena informações sobre chamadas de voz 1:1
 *
 * Esta tabela armazena metadados das chamadas (quem ligou, quando, duração, etc.)
 * O áudio em si é transmitido via WebRTC P2P, não é armazenado.
 */
export const callRooms = pgTable(
  'call_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    callerId: uuid('caller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('ringing'), // 'ringing', 'active', 'ended', 'rejected', 'missed'
    startedAt: timestamp('started_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    answeredAt: timestamp('answered_at', { withTimezone: false }), // Quando foi atendida
    endedAt: timestamp('ended_at', { withTimezone: false }), // Quando foi encerrada
    duration: integer('duration'), // Duração em segundos (calculado após encerrar)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Índice para buscar chamadas de um usuário
    callerIdIdx: index('call_rooms_caller_id_idx').on(table.callerId),
    receiverIdIdx: index('call_rooms_receiver_id_idx').on(table.receiverId),
    // Índice para buscar chamadas recentes
    startedAtIdx: index('call_rooms_started_at_idx').on(table.startedAt),
  }),
);

/**
 * Tabela quiz_sessions - Armazena sessões de quiz geradas pela IA
 *
 * Cada sessão representa um conjunto de 10 questões sobre um tópico específico
 * gerado pela IA Gemini baseado no prompt do usuário.
 */
export const quizSessions = pgTable(
  'quiz_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(), // Tópico escolhido pelo usuário (ex: "física", "biologia")
    status: quizStatusEnum('status').notNull().default('IN_PROGRESS'),
    score: integer('score').default(0), // Pontuação do usuário (calculada ao finalizar)
    totalQuestions: integer('total_questions').notNull().default(10),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: false }), // Quando foi finalizado
  },
  (table) => ({
    userIdIdx: index('quiz_sessions_user_id_idx').on(table.userId),
    statusIdx: index('quiz_sessions_status_idx').on(table.status),
    createdAtIdx: index('quiz_sessions_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Tabela quiz_questions - Armazena questões de cada sessão de quiz
 *
 * Cada questão é gerada pela IA e possui 4 alternativas.
 * A resposta correta e explicação são armazenadas para mostrar o gabarito.
 */
export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(), // Texto da pergunta
    correctOption: integer('correct_option').notNull(), // Número da alternativa correta (1-4)
    explanation: text('explanation').notNull(), // Explicação da resposta correta
    order: integer('order').notNull().default(0), // Ordem da questão no quiz
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('quiz_questions_session_id_idx').on(table.sessionId),
    orderIdx: index('quiz_questions_order_idx').on(table.order),
  }),
);

/**
 * Tabela quiz_options - Armazena as alternativas de cada questão
 *
 * Cada questão possui 4 opções de resposta geradas pela IA.
 */
export const quizOptions = pgTable(
  'quiz_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => quizQuestions.id, { onDelete: 'cascade' }),
    optionText: text('option_text').notNull(), // Texto da alternativa
    optionNumber: integer('option_number').notNull(), // Número da alternativa (1-4)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    questionIdIdx: index('quiz_options_question_id_idx').on(table.questionId),
  }),
);

/**
 * Tabela quiz_answers - Armazena as respostas do usuário
 *
 * Registra qual alternativa o usuário selecionou para cada questão.
 */
export const quizAnswers = pgTable(
  'quiz_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => quizQuestions.id, { onDelete: 'cascade' }),
    selectedOption: integer('selected_option').notNull(), // Alternativa selecionada pelo usuário (1-4)
    isCorrect: text('is_correct').notNull(), // 'true' ou 'false'
    answeredAt: timestamp('answered_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('quiz_answers_session_id_idx').on(table.sessionId),
    questionIdIdx: index('quiz_answers_question_id_idx').on(table.questionId),
    // Garante que cada questão só pode ser respondida uma vez por sessão
    sessionQuestionIdx: uniqueIndex('quiz_answers_session_question_unique').on(
      table.sessionId,
      table.questionId,
    ),
  }),
);

// ============================================
// ASSINATURAS E PAGAMENTOS
// ============================================

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'START',
  'PRO',
  'ULTRA',
  'PRODUCER',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'PENDING', // Aguardando primeiro pagamento
  'ACTIVE', // Ativa e em dia
  'OVERDUE', // Em atraso
  'CANCELLED', // Cancelada pelo usuário
  'EXPIRED', // Expirada
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'PIX',
  'CREDIT_CARD',
  'BOLETO',
]);

/**
 * Tabela subscriptions - Armazena assinaturas dos usuários
 *
 * Esta tabela armazena informações sobre as assinaturas dos usuários,
 * incluindo o plano, status, datas e referências ao Asaas.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    asaasCustomerId: text('asaas_customer_id').notNull(), // ID do cliente no Asaas
    asaasSubscriptionId: text('asaas_subscription_id'), // ID da assinatura no Asaas
    plan: subscriptionPlanEnum('plan').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('PENDING'),
    paymentMethod: paymentMethodEnum('payment_method'),
    // Preço atual da assinatura
    currentPrice: integer('current_price').notNull(), // Em centavos
    // Plano para o qual o usuário quer mudar (upgrade/downgrade)
    pendingPlanChange: subscriptionPlanEnum('pending_plan_change'),
    // Quando a mudança pendente foi criada (para expiração após 30 min)
    pendingPlanChangeCreatedAt: timestamp('pending_plan_change_created_at', {
      withTimezone: false,
    }),
    // Datas importantes
    startDate: timestamp('start_date', { withTimezone: false }),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: false,
    }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: false }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    // Email do comprador (antes de criar conta)
    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
    asaasCustomerIdIdx: index('subscriptions_asaas_customer_id_idx').on(
      table.asaasCustomerId,
    ),
    asaasSubscriptionIdIdx: index('subscriptions_asaas_subscription_id_idx').on(
      table.asaasSubscriptionId,
    ),
    statusIdx: index('subscriptions_status_idx').on(table.status),
    customerEmailIdx: index('subscriptions_customer_email_idx').on(
      table.customerEmail,
    ),
    createdAtIdx: index('subscriptions_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Tabela registration_tokens - Tokens para registro após pagamento
 *
 * Quando o usuário paga, recebe um email com link contendo um token.
 * Este token é usado para permitir o cadastro na plataforma.
 */
export const registrationTokens = pgTable(
  'registration_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    token: text('token').notNull(), // Token único para o link de registro
    email: text('email').notNull(), // Email do usuário
    isUsed: text('is_used').notNull().default('false'),
    usedAt: timestamp('used_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('registration_tokens_token_unique').on(table.token),
    subscriptionIdIdx: index('registration_tokens_subscription_id_idx').on(
      table.subscriptionId,
    ),
    emailIdx: index('registration_tokens_email_idx').on(table.email),
    expiresAtIdx: index('registration_tokens_expires_at_idx').on(
      table.expiresAt,
    ),
  }),
);

/**
 * Tabela payment_history - Histórico de pagamentos
 *
 * Armazena o histórico de todos os pagamentos recebidos via webhook do Asaas.
 */
export const paymentHistory = pgTable(
  'payment_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    asaasPaymentId: text('asaas_payment_id').notNull(), // ID do pagamento no Asaas
    amount: integer('amount').notNull(), // Em centavos
    netAmount: integer('net_amount'), // Valor líquido em centavos
    paymentMethod: paymentMethodEnum('payment_method'),
    status: text('status').notNull(), // Status do pagamento no Asaas
    paidAt: timestamp('paid_at', { withTimezone: false }),
    dueDate: timestamp('due_date', { withTimezone: false }),
    invoiceUrl: text('invoice_url'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    subscriptionIdIdx: index('payment_history_subscription_id_idx').on(
      table.subscriptionId,
    ),
    asaasPaymentIdIdx: uniqueIndex('payment_history_asaas_payment_id_unique').on(
      table.asaasPaymentId,
    ),
    statusIdx: index('payment_history_status_idx').on(table.status),
    paidAtIdx: index('payment_history_paid_at_idx').on(table.paidAt),
    createdAtIdx: index('payment_history_created_at_idx').on(table.createdAt),
  }),
);

// ============================================
// NOTAS FISCAIS (NFS-e)
// ============================================

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'SCHEDULED', // Agendada
  'AUTHORIZED', // Autorizada/Emitida
  'PROCESSING_CANCELLATION', // Processando cancelamento
  'CANCELLED', // Cancelada
  'CANCELLATION_DENIED', // Cancelamento negado
  'ERROR', // Erro
]);

export const effectiveDatePeriodEnum = pgEnum('effective_date_period', [
  'ON_PAYMENT_CONFIRMATION', // Emitir na confirmação do pagamento
  'ON_PAYMENT_DUE_DATE', // Emitir na data de vencimento
  'BEFORE_PAYMENT_DUE_DATE', // Emitir antes do vencimento
  'ON_NEXT_MONTH', // Emitir no próximo mês
]);

/**
 * Tabela fiscal_info - Configurações fiscais da empresa
 *
 * Armazena as informações fiscais necessárias para emissão de NFS-e,
 * como inscrição municipal, regime tributário, série RPS, etc.
 */
export const fiscalInfo = pgTable('fiscal_info', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(), // Email para envio de NF
  municipalInscription: text('municipal_inscription').notNull(), // Inscrição municipal
  simplesNacional: text('simples_nacional').notNull().default('true'), // 'true' ou 'false'
  rpsSerie: text('rps_serie').notNull(), // Série do RPS
  rpsNumber: integer('rps_number').notNull(), // Número inicial do RPS
  specialTaxRegime: text('special_tax_regime'), // Regime especial de tributação
  serviceListItem: text('service_list_item'), // Item da lista de serviços
  cnae: text('cnae'), // Código CNAE
  createdAt: timestamp('created_at', { withTimezone: false })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false })
    .notNull()
    .defaultNow(),
});

/**
 * Tabela invoice_history - Histórico de notas fiscais emitidas
 *
 * Armazena o histórico de todas as notas fiscais emitidas via Asaas,
 * incluindo status, URLs de PDF/XML, e informações de validação.
 */
export const invoiceHistory = pgTable(
  'invoice_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    asaasInvoiceId: text('asaas_invoice_id').notNull(), // ID da NF no Asaas
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
      onDelete: 'cascade',
    }),
    paymentId: text('payment_id'), // ID do pagamento no Asaas (não FK pois vem do webhook)
    status: invoiceStatusEnum('status').notNull().default('SCHEDULED'),
    customerName: text('customer_name').notNull(),
    value: integer('value').notNull(), // Em centavos
    serviceDescription: text('service_description').notNull(),
    effectiveDate: timestamp('effective_date', { withTimezone: false }).notNull(), // Data de emissão
    pdfUrl: text('pdf_url'),
    xmlUrl: text('xml_url'),
    number: text('number'), // Número da NF
    validationCode: text('validation_code'), // Código de validação
    errorMessage: text('error_message'), // Mensagem de erro (se status = ERROR)
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    asaasInvoiceIdIdx: uniqueIndex('invoice_history_asaas_invoice_id_unique').on(
      table.asaasInvoiceId,
    ),
    subscriptionIdIdx: index('invoice_history_subscription_id_idx').on(
      table.subscriptionId,
    ),
    paymentIdIdx: index('invoice_history_payment_id_idx').on(table.paymentId),
    statusIdx: index('invoice_history_status_idx').on(table.status),
    effectiveDateIdx: index('invoice_history_effective_date_idx').on(
      table.effectiveDate,
    ),
    createdAtIdx: index('invoice_history_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Tabela auto_invoice_config - Configuração de emissão automática de NF
 *
 * Armazena as configurações de emissão automática de notas fiscais
 * para assinaturas. Quando configurado, as NFs são emitidas automaticamente
 * quando os pagamentos são confirmados.
 */
export const autoInvoiceConfig = pgTable(
  'auto_invoice_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    asaasConfigId: text('asaas_config_id').notNull(), // ID da config no Asaas
    municipalServiceCode: text('municipal_service_code'),
    municipalServiceName: text('municipal_service_name'),
    effectiveDatePeriod: effectiveDatePeriodEnum('effective_date_period')
      .notNull()
      .default('ON_PAYMENT_CONFIRMATION'),
    observations: text('observations'),
    isActive: text('is_active').notNull().default('true'), // 'true' ou 'false'
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    subscriptionIdIdx: uniqueIndex(
      'auto_invoice_config_subscription_id_unique',
    ).on(table.subscriptionId),
    asaasConfigIdIdx: index('auto_invoice_config_asaas_config_id_idx').on(
      table.asaasConfigId,
    ),
    isActiveIdx: index('auto_invoice_config_is_active_idx').on(table.isActive),
    createdAtIdx: index('auto_invoice_config_created_at_idx').on(
      table.createdAt,
    ),
  }),
);