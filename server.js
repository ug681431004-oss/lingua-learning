require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// CREATE TABLES IN CORRECT ORDER
// ============================================
async function initDatabase() {
    try {
        // 1. Create USERS table FIRST (most important)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                full_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active'
            );
        `);
        console.log('✅ Users table created');

        // 2. Create USER_STATS table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                total_score INTEGER DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                games_won INTEGER DEFAULT 0,
                sessions INTEGER DEFAULT 0,
                last_played TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ User stats table created');

        // 3. Create ROLE table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS role (
                role_id SERIAL PRIMARY KEY,
                role_type VARCHAR(50) NOT NULL UNIQUE,
                access_level INTEGER DEFAULT 1,
                assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                role_status VARCHAR(20) DEFAULT 'active'
            );
        `);
        console.log('✅ Role table created');

        // 4. Create COURSE_SETUP table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_setup (
                course_id SERIAL PRIMARY KEY,
                teacher_id INTEGER,
                course_name VARCHAR(100) NOT NULL,
                language VARCHAR(50) NOT NULL,
                schedule VARCHAR(100),
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Course setup table created');

        // 5. Create PROGRESS_DATA table (depends on users + course_setup)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS progress_data (
                progress_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER DEFAULT 1,
                lessons_completed INTEGER DEFAULT 0,
                quiz_score INTEGER DEFAULT 0,
                time_spent INTEGER DEFAULT 0,
                last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                overall_progress DECIMAL(5,2) DEFAULT 0
            );
        `);
        console.log('✅ Progress data table created');

        // 6. Create GAME_HISTORY table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game_mode VARCHAR(50),
                score INTEGER DEFAULT 0,
                total_questions INTEGER DEFAULT 0,
                category VARCHAR(50),
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Game history table created');

        // 7. Create CATEGORY_SCORES table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS category_scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL,
                total_score INTEGER DEFAULT 0,
                games_count INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                UNIQUE(user_id, category)
            );
        `);
        console.log('✅ Category scores table created');

        // 8. Create USAGE_DATA table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usage_data (
                usage_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                total_logins INTEGER DEFAULT 0,
                lessons_opened INTEGER DEFAULT 0,
                activities_completed INTEGER DEFAULT 0,
                time_online INTEGER DEFAULT 0,
                last_login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Usage data table created');

        // 9. Create LOGIN_DATA table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS login_data (
                login_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                session_token VARCHAR(255),
                login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                login_status VARCHAR(20) DEFAULT 'success'
            );
        `);
        console.log('✅ Login data table created');

        // 10. Create ATTENDANCE table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                attendance_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES course_setup(course_id) ON DELETE CASCADE,
                session_date DATE DEFAULT CURRENT_DATE,
                status VARCHAR(20) DEFAULT 'present',
                total_sessions INTEGER DEFAULT 0,
                attendance_rate DECIMAL(5,2) DEFAULT 0.00,
                UNIQUE(user_id, course_id, session_date)
            );
        `);
        console.log('✅ Attendance table created');

        // 11. Create FEEDBACK table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id SERIAL PRIMARY KEY,
                teacher_id INTEGER REFERENCES users(id),
                student_id INTEGER REFERENCES users(id),
                course_id INTEGER REFERENCES course_setup(course_id),
                comments TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Feedback table created');

        // 12. Create LEARN_CONTENT table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS learn_content (
                content_id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES course_setup(course_id) ON DELETE CASCADE,
                teacher_id INTEGER REFERENCES users(id),
                content_title VARCHAR(200) NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                difficulty_level VARCHAR(20) DEFAULT 'beginner',
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Learn content table created');

        // 13. Create LEARN_REQUEST table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS learn_request (
                request_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES course_setup(course_id) ON DELETE CASCADE,
                language_req VARCHAR(50) NOT NULL,
                lesson_topic VARCHAR(200) NOT NULL,
                request_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                request_status VARCHAR(20) DEFAULT 'pending'
            );
        `);
        console.log('✅ Learn request table created');

        // ============================================
        // INSERT DEFAULT DATA
        // ============================================

        // Insert roles
        await pool.query(`
            INSERT INTO role (role_type, access_level) VALUES 
                ('admin', 3),
                ('teacher', 2),
                ('student', 1)
            ON CONFLICT (role_type) DO NOTHING;
        `);
        console.log('✅ Roles inserted');

        // Insert default course
        await pool.query(`
            INSERT INTO course_setup (course_id, course_name, language, schedule) 
            VALUES (1, 'General Vocabulary', 'Multilingual', 'Self-paced')
            ON CONFLICT (course_id) DO NOTHING;
        `);
        console.log('✅ Default course inserted');

        // Insert admin user (password: admin123)
        await pool.query(`
            INSERT INTO users (username, password_hash, email, full_name, status) 
            VALUES ('admin', '$2a$10$CpFPl8mza/G9RP6.t6w7Fe92IHgojczAhAlNfpzHjGevMUdWZruYa', 'admin@system.com', 'System Admin', 'active')
            ON CONFLICT (username) DO NOTHING;
        `);
        console.log('✅ Admin user inserted');

        // Insert admin stats
        await pool.query(`
            INSERT INTO user_stats (user_id) 
            SELECT id FROM users WHERE username = 'admin'
            ON CONFLICT (user_id) DO NOTHING;
        `);
        console.log('✅ Admin stats inserted');

        console.log('✅ All tables and default data created successfully!');

    } catch (error) {
        console.error('❌ Database init error:', error);
    }
}

// Run database initialization
initDatabase();

// ============================================
// TEST ENDPOINT
// ============================================
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// REGISTER ENDPOINT
// ============================================
app.post('/api/register', async (req, res) => {
    const { username, password, email, fullName } = req.body;
    
    console.log('📝 Registration attempt for:', username);
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username and password are required' 
        });
    }
    
    if (username.length < 2) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username must be at least 2 characters' 
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            error: 'Password must be at least 6 characters' 
        });
    }
    
    try {
        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                error: 'Username already exists' 
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await pool.query('BEGIN');
        
        // Insert user
        const result = await pool.query(
            `INSERT INTO users (username, password_hash, email, full_name, created_at, status) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'active') 
             RETURNING id, username, email, full_name, created_at`,
            [username, hashedPassword, email || null, fullName || username]
        );
        
        const newUser = result.rows[0];
        
        // Insert into user_stats
        await pool.query(
            `INSERT INTO user_stats (user_id, total_score, games_played, best_score, games_won, sessions) 
             VALUES ($1, 0, 0, 0, 0, 0)`,
            [newUser.id]
        );
        
        await pool.query('COMMIT');
        
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ User registered:', username);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name,
                created_at: newUser.created_at
            },
            token: token
        });
        
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Registration error:', error);
        
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// ============================================
// LOGIN ENDPOINT
// ============================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('🔑 Login attempt for:', username);
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username and password are required' 
        });
    }
    
    try {
        const result = await pool.query(
            `SELECT id, username, password_hash, email, full_name, created_at, status
             FROM users 
             WHERE username = $1 AND status = 'active'`,
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }
        
        const user = result.rows[0];
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }
        
        // Update last_login
        await pool.query(
            `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
        );
        
        // Update session count
        await pool.query(
            `UPDATE user_stats SET sessions = sessions + 1 WHERE user_id = $1`,
            [user.id]
        );
        
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ User logged in:', username);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                created_at: user.created_at
            },
            token: token
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// ============================================
// ADMIN - GET ALL USERS
// ============================================
app.get('/api/admin/users', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const username = decoded.username;
        
        if (username !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Admin access required' 
            });
        }
        
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.full_name, u.created_at, u.last_login,
                    COALESCE(us.total_score, 0) as total_score,
                    COALESCE(us.games_played, 0) as games_played,
                    COALESCE(us.best_score, 0) as best_score,
                    COALESCE(us.games_won, 0) as games_won,
                    COALESCE(us.sessions, 0) as sessions
             FROM users u
             LEFT JOIN user_stats us ON u.id = us.user_id
             ORDER BY u.id`
        );
        
        res.json({
            success: true,
            users: result.rows
        });
        
    } catch (error) {
        console.error('❌ Admin error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// ============================================
// LEADERBOARD ENDPOINT
// ============================================
app.get('/api/leaderboard', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, 
                    COALESCE(us.total_score, 0) as total_score,
                    COALESCE(us.games_played, 0) as games_played,
                    COALESCE(us.best_score, 0) as best_score,
                    COALESCE(us.games_won, 0) as games_won,
                    u.created_at
             FROM users u
             LEFT JOIN user_stats us ON u.id = us.user_id
             ORDER BY us.total_score DESC NULLS LAST
             LIMIT $1`,
            [limit]
        );
        
        res.json({
            success: true,
            leaderboard: result.rows
        });
        
    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// ============================================
// GET USER PROFILE (for stats)
// ============================================
app.get('/api/profile/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid user ID' 
        });
    }
    
    try {
        // Get user info
        const userResult = await pool.query(
            `SELECT id, username, email, full_name, created_at, last_login, status
             FROM users WHERE id = $1`,
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        // Get stats
        const statsResult = await pool.query(
            `SELECT total_score, games_played, best_score, games_won, 
                    sessions, last_played 
             FROM user_stats WHERE user_id = $1`,
            [userId]
        );
        
        // Get recent games
        const historyResult = await pool.query(
            `SELECT game_mode, score, total_questions, category, played_at 
             FROM game_history 
             WHERE user_id = $1 
             ORDER BY played_at DESC 
             LIMIT 10`,
            [userId]
        );
        
        res.json({
            success: true,
            user: userResult.rows[0],
            stats: statsResult.rows[0] || {
                total_score: 0,
                games_played: 0,
                best_score: 0,
                games_won: 0,
                sessions: 0
            },
            recentGames: historyResult.rows || []
        });
        
    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// ============================================
// SAVE PROGRESS ENDPOINT
// ============================================
app.post('/api/save-progress', async (req, res) => {
    const { userId, courseId, lessonsCompleted, quizScore, timeSpent } = req.body;
    
    console.log('📊 Saving progress for user:', userId);
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            error: 'User ID is required' 
        });
    }
    
    try {
        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        const validCourseId = 1;
        
        const checkResult = await pool.query(
            'SELECT progress_id, lessons_completed FROM progress_data WHERE user_id = $1 AND course_id = $2',
            [userId, validCourseId]
        );
        
        if (checkResult.rows.length > 0) {
            const current = checkResult.rows[0];
            const newLessons = current.lessons_completed + (lessonsCompleted || 0);
            
            const result = await pool.query(
                `UPDATE progress_data 
                 SET lessons_completed = $1,
                     quiz_score = GREATEST(quiz_score, $2),
                     time_spent = time_spent + $3,
                     last_activity_date = CURRENT_TIMESTAMP
                 WHERE user_id = $4 AND course_id = $5
                 RETURNING *`,
                [newLessons, quizScore || 0, timeSpent || 0, userId, validCourseId]
            );
            
            console.log('✅ Progress updated for user:', userId);
            
            await pool.query(
                `UPDATE user_stats 
                 SET total_score = total_score + $2,
                     games_played = games_played + 1,
                     best_score = GREATEST(best_score, $2),
                     games_won = games_won + CASE WHEN $2 >= 70 THEN 1 ELSE 0 END,
                     last_played = CURRENT_TIMESTAMP
                 WHERE user_id = $1`,
                [userId, quizScore || 0]
            );
            
            res.json({
                success: true,
                message: 'Progress updated successfully',
                progress: result.rows[0]
            });
        } else {
            const result = await pool.query(
                `INSERT INTO progress_data (user_id, course_id, lessons_completed, quiz_score, time_spent, overall_progress) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [userId, validCourseId, lessonsCompleted || 0, quizScore || 0, timeSpent || 0, 0]
            );
            
            console.log('✅ New progress created for user:', userId);
            
            await pool.query(
                `UPDATE user_stats 
                 SET total_score = total_score + $2,
                     games_played = games_played + 1,
                     best_score = GREATEST(best_score, $2),
                     games_won = games_won + CASE WHEN $2 >= 70 THEN 1 ELSE 0 END,
                     last_played = CURRENT_TIMESTAMP
                 WHERE user_id = $1`,
                [userId, quizScore || 0]
            );
            
            res.json({
                success: true,
                message: 'Progress created successfully',
                progress: result.rows[0]
            });
        }
        
    } catch (error) {
        console.error('❌ Progress error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// ============================================
// SAVE GAME STATS
// ============================================
app.post('/api/save-game-stats', async (req, res) => {
    const { userId, xp, level, streak, lessonsCompleted, hearts } = req.body;
    
    console.log('🎮 Saving game stats for user:', userId);
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            error: 'User ID is required' 
        });
    }
    
    try {
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        const result = await pool.query(
            `UPDATE user_stats 
             SET total_score = $1,
                 games_played = games_played + 1,
                 best_score = GREATEST(best_score, $1),
                 last_played = CURRENT_TIMESTAMP
             WHERE user_id = $2
             RETURNING *`,
            [xp || 0, userId]
        );
        
        console.log('✅ Game stats saved for user:', userId);
        
        res.json({
            success: true,
            message: 'Game stats saved successfully',
            stats: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Save game stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// ============================================
// GET USER GAME STATS
// ============================================
app.get('/api/game-stats/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid user ID' 
        });
    }
    
    try {
        const result = await pool.query(
            `SELECT total_score as xp, games_played as lessons_completed, 
                    best_score, games_won, sessions
             FROM user_stats 
             WHERE user_id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User stats not found' 
            });
        }
        
        res.json({
            success: true,
            stats: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Get game stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Registration: http://localhost:${PORT}/api/register`);
    console.log(`📋 Login: http://localhost:${PORT}/api/login`);
    console.log(`📋 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
    console.log(`📋 Admin: http://localhost:${PORT}/api/admin/users`);
    console.log(`📋 Profile: http://localhost:${PORT}/api/profile/:userId`);
    console.log(`📋 Game Stats: http://localhost:${PORT}/api/game-stats/:userId`);
});

console.log('✅ Server ready!');
