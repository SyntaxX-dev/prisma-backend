const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function setupProduction() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('🔌 Conectado ao banco de produção');

        const existingAdmin = await client.query(
            "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
        );

        if (existingAdmin.rows.length > 0) {
            console.log('✅ Admin já existe, pulando criação');
            return;
        }

        const adminData = {
            name: 'Administrador',
            email: process.env.ADMIN_EMAIL || 'admin@prisma-back.com',
            password: process.env.ADMIN_PASSWORD || 'admin123456',
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

        console.log('✅ Usuário admin criado em produção!');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);

    } catch (error) {
        console.error('❌ Erro no setup de produção:', error.message);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    setupProduction();
}

module.exports = { setupProduction };
