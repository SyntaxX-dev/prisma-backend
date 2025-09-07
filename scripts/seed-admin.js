const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
    });

    try {
        await client.connect();
        console.log('🔌 Conectado ao banco de dados');

        const existingAdmin = await client.query(
            "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
        );

        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  Já existe um usuário admin no banco de dados');
            return;
        }

        const adminData = {
            name: 'Administrador',
            email: 'admin@prisma-back.com',
            password: 'admin123456',
            role: 'ADMIN',
            educationLevel: 'POSTGRADUATE'
        };

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

        const result = await client.query(
            `INSERT INTO users (name, email, password_hash, role, education_level, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, name, email, role`,
            [
                adminData.name,
                adminData.email,
                passwordHash,
                adminData.role,
                adminData.educationLevel
            ]
        );

        const admin = result.rows[0];

        console.log('✅ Usuário admin criado com sucesso!');
        console.log('📋 Detalhes do admin:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Nome: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Senha: ${adminData.password}`);
        console.log('');
        console.log('⚠️  IMPORTANTE: Altere a senha padrão em produção!');

    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Conexão com banco encerrada');
    }
}

if (require.main === module) {
    createAdminUser();
}

module.exports = { createAdminUser };
