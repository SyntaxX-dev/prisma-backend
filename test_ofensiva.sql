-- ============================================
-- Script de Teste - Correção de Ofensiva
-- ============================================
-- Este script testa se a ofensiva está incrementando corretamente
-- quando vídeos são completados em dias consecutivos

-- ============================================
-- SETUP: Criar dados de teste
-- ============================================

-- 1. Criar usuário de teste
DO $$
DECLARE
  test_user_id UUID := '12345678-1234-1234-1234-123456789abc';
  test_subcourse_id UUID := '87654321-4321-4321-4321-cba987654321';
  test_video1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_video2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_video3_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Limpar dados anteriores
  DELETE FROM video_progress WHERE user_id = test_user_id;
  DELETE FROM offensives WHERE user_id = test_user_id;
  DELETE FROM videos WHERE id IN (test_video1_id, test_video2_id, test_video3_id);
  DELETE FROM sub_courses WHERE id = test_subcourse_id;
  DELETE FROM users WHERE id = test_user_id;
  
  -- Criar usuário
  INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
  VALUES (
    test_user_id,
    'teste_ofensiva@example.com',
    'Usuário Teste Ofensiva',
    '$2b$10$X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X',
    NOW(),
    NOW()
  );
  
  -- Criar subcurso
  INSERT INTO sub_courses (id, title, description, created_at, updated_at)
  VALUES (
    test_subcourse_id,
    'Curso Teste Ofensiva',
    'Curso para testar a funcionalidade de ofensiva',
    NOW(),
    NOW()
  );
  
  -- Criar vídeos de teste
  INSERT INTO videos (id, video_id, title, url, sub_course_id, created_at, updated_at)
  VALUES 
    (test_video1_id, 'test_video_1', 'Vídeo Teste 1', 'https://youtube.com/watch?v=test1', test_subcourse_id, NOW(), NOW()),
    (test_video2_id, 'test_video_2', 'Vídeo Teste 2', 'https://youtube.com/watch?v=test2', test_subcourse_id, NOW(), NOW()),
    (test_video3_id, 'test_video_3', 'Vídeo Teste 3', 'https://youtube.com/watch?v=test3', test_subcourse_id, NOW(), NOW());
  
  RAISE NOTICE 'Dados de teste criados com sucesso!';
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'SubCourse ID: %', test_subcourse_id;
  RAISE NOTICE 'Video 1 ID: %', test_video1_id;
END $$;

-- ============================================
-- CENÁRIO 1: Simular ofensiva de ONTEM
-- ============================================

DO $$
DECLARE
  test_user_id UUID := '12345678-1234-1234-1234-123456789abc';
  test_video1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_subcourse_id UUID := '87654321-4321-4321-4321-cba987654321';
BEGIN
  -- Simular que o usuário completou um vídeo ONTEM
  INSERT INTO video_progress (user_id, video_id, sub_course_id, is_completed, completed_at, created_at, updated_at)
  VALUES (
    test_user_id,
    test_video1_id,
    test_subcourse_id,
    'true',
    CURRENT_DATE - INTERVAL '1 day' + TIME '12:00:00',  -- Ontem ao meio-dia
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '1 day'
  );
  
  -- Criar ofensiva de ontem
  INSERT INTO offensives (
    user_id,
    type,
    consecutive_days,
    last_video_completed_at,
    streak_start_date,
    total_offensives,
    created_at,
    updated_at
  )
  VALUES (
    test_user_id,
    'NORMAL',
    1,
    CURRENT_DATE - INTERVAL '1 day' + TIME '12:00:00',  -- Ontem ao meio-dia
    CURRENT_DATE - INTERVAL '1 day',
    1,
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '1 day'
  );
  
  RAISE NOTICE 'Cenário 1 configurado: Usuário tem ofensiva de ONTEM com 1 dia consecutivo';
END $$;

-- ============================================
-- VERIFICAR ESTADO INICIAL
-- ============================================

SELECT 
  '=== ESTADO INICIAL ===' as info,
  o.consecutive_days as "Dias Consecutivos",
  o.type as "Tipo",
  o.last_video_completed_at as "Última Conclusão",
  DATE_PART('day', CURRENT_DATE - DATE(o.last_video_completed_at)) as "Dias Atrás",
  o.total_offensives as "Total de Ofensivas"
FROM offensives o
WHERE o.user_id = '12345678-1234-1234-1234-123456789abc';

-- ============================================
-- INSTRUÇÃO: AGORA COMPLETE UM VÍDEO VIA API
-- ============================================

SELECT 
  '=== INSTRUÇÃO ===' as titulo,
  'Agora use a API para completar o Vídeo 2:' as instrucao,
  '' as linha1,
  'POST http://localhost:3000/videos/progress/toggle' as endpoint,
  'Authorization: Bearer SEU_TOKEN' as header1,
  'Content-Type: application/json' as header2,
  '' as linha2,
  'Body:' as body_label,
  '{ "videoId": "test_video_2", "isCompleted": true }' as body,
  '' as linha3,
  'Depois execute o próximo SELECT para verificar o resultado.' as proxima_etapa;

-- ============================================
-- AGUARDAR: Execute a API acima antes de continuar
-- ============================================

-- ============================================
-- VERIFICAR RESULTADO APÓS COMPLETAR VÍDEO HOJE
-- ============================================

SELECT 
  '=== RESULTADO ESPERADO APÓS CORREÇÃO ===' as info,
  o.consecutive_days as "Dias Consecutivos (deve ser 2)",
  o.type as "Tipo",
  o.last_video_completed_at as "Última Conclusão (deve ser hoje)",
  DATE_PART('day', CURRENT_DATE - DATE(o.last_video_completed_at)) as "Dias Atrás (deve ser 0)",
  o.total_offensives as "Total de Ofensivas",
  CASE 
    WHEN o.consecutive_days = 2 THEN '✅ SUCESSO - Ofensiva incrementada!'
    WHEN o.consecutive_days = 1 THEN '❌ FALHA - Ofensiva NÃO foi incrementada'
    ELSE '⚠️ ATENÇÃO - Valor inesperado'
  END as "Status do Teste"
FROM offensives o
WHERE o.user_id = '12345678-1234-1234-1234-123456789abc';

-- ============================================
-- VERIFICAR HISTÓRICO DE VÍDEOS COMPLETADOS
-- ============================================

SELECT 
  '=== HISTÓRICO DE VÍDEOS COMPLETADOS ===' as info,
  v.title as "Vídeo",
  vp.completed_at as "Data de Conclusão",
  DATE_PART('day', CURRENT_DATE - DATE(vp.completed_at)) as "Dias Atrás"
FROM video_progress vp
JOIN videos v ON v.id = vp.video_id
WHERE vp.user_id = '12345678-1234-1234-1234-123456789abc'
  AND vp.is_completed = 'true'
ORDER BY vp.completed_at DESC;

-- ============================================
-- TESTE ADICIONAL: Completar outro vídeo no MESMO DIA
-- ============================================

SELECT 
  '=== TESTE ADICIONAL ===' as titulo,
  'Teste completar OUTRO vídeo hoje (Vídeo 3):' as instrucao,
  '' as linha1,
  'POST http://localhost:3000/videos/progress/toggle' as endpoint,
  'Body: { "videoId": "test_video_3", "isCompleted": true }' as body,
  '' as linha2,
  'Resultado esperado: Ofensiva deve MANTER 2 dias (não incrementar)' as expectativa,
  'Mensagem esperada: "Você já ganhou uma ofensiva hoje!"' as mensagem;

-- ============================================
-- VERIFICAR QUE NÃO INCREMENTOU NO MESMO DIA
-- ============================================

SELECT 
  '=== VERIFICAR MESMO DIA ===' as info,
  o.consecutive_days as "Dias Consecutivos (ainda deve ser 2)",
  o.total_offensives as "Total de Ofensivas",
  COUNT(vp.id) as "Vídeos Completados Hoje",
  CASE 
    WHEN o.consecutive_days = 2 THEN '✅ CORRETO - Não incrementou no mesmo dia'
    ELSE '❌ ERRO - Incrementou indevidamente'
  END as "Status"
FROM offensives o
LEFT JOIN video_progress vp ON vp.user_id = o.user_id 
  AND vp.is_completed = 'true'
  AND DATE(vp.completed_at) = CURRENT_DATE
WHERE o.user_id = '12345678-1234-1234-1234-123456789abc'
GROUP BY o.id, o.consecutive_days, o.total_offensives;

-- ============================================
-- CLEANUP: Remover dados de teste (OPCIONAL)
-- ============================================

-- Descomente as linhas abaixo para limpar os dados de teste:
/*
DELETE FROM video_progress WHERE user_id = '12345678-1234-1234-1234-123456789abc';
DELETE FROM offensives WHERE user_id = '12345678-1234-1234-1234-123456789abc';
DELETE FROM videos WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
DELETE FROM sub_courses WHERE id = '87654321-4321-4321-4321-cba987654321';
DELETE FROM users WHERE id = '12345678-1234-1234-1234-123456789abc';

SELECT 'Dados de teste removidos com sucesso!' as resultado;
*/

-- ============================================
-- RESUMO DO TESTE
-- ============================================

SELECT 
  '=== RESUMO DO TESTE ===' as titulo,
  '' as linha1,
  '1. ✅ Criar dados de teste (usuário, vídeos, ofensiva de ontem)' as etapa1,
  '2. ✅ Verificar estado inicial (1 dia consecutivo)' as etapa2,
  '3. 🔄 Completar vídeo HOJE via API' as etapa3,
  '4. ✅ Verificar que ofensiva incrementou para 2 dias' as etapa4,
  '5. 🔄 Completar OUTRO vídeo hoje via API' as etapa5,
  '6. ✅ Verificar que ofensiva MANTEVE 2 dias (não incrementou)' as etapa6,
  '' as linha2,
  'Se todos os testes passaram, a correção está funcionando! 🎉' as conclusao;

